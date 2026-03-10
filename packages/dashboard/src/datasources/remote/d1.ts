import type {
  D1DataSource,
  D1DatabaseInfo,
  D1TableInfo,
  D1TableDetail,
  D1ColumnInfo,
  RowQueryOpts,
  RowsResult,
  QueryResult,
  MutationResult,
  BulkMutationResult,
  RowIdentifier,
} from '../types'
import type { CloudflareClient } from './client'

interface CFD1Database {
  uuid: string
  name: string
  version: string
  num_tables: number
  file_size: number
  created_at: string
}

interface CFD1QueryResult {
  success: boolean
  results: Record<string, unknown>[]
  meta: {
    changed_db: boolean
    changes: number
    duration: number
    last_row_id: number
    rows_read: number
    rows_written: number
    size_after: number
  }
}

export class RemoteD1DataSource implements D1DataSource {
  private dbIdMap = new Map<string, string>()

  constructor(private readonly client: CloudflareClient) {}

  async listDatabases(): Promise<D1DatabaseInfo[]> {
    const result = await this.client.fetch<CFD1Database[]>('/d1/database')

    const databases = result.map((db): D1DatabaseInfo => {
      this.dbIdMap.set(db.name, db.uuid)
      return {
        binding: db.name,
        database_name: db.name,
        database_id: db.uuid,
      }
    })

    return databases
  }

  async getSchema(binding: string): Promise<D1TableInfo[]> {
    const dbId = await this.resolveDbId(binding)
    const result = await this.executeQuery(dbId, "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'")

    return (result.results ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        name: r.name as string,
        sql: (r.sql as string) ?? '',
      }
    })
  }

  async getTableInfo(binding: string, table: string): Promise<D1TableDetail> {
    const dbId = await this.resolveDbId(binding)

    const [columnsResult, indexesResult, fkResult, countResult] = await Promise.all([
      this.executeQuery(dbId, `PRAGMA table_info("${table}")`),
      this.executeQuery(dbId, `PRAGMA index_list("${table}")`),
      this.executeQuery(dbId, `PRAGMA foreign_key_list("${table}")`),
      this.executeQuery(dbId, `SELECT COUNT(*) as count FROM "${table}"`),
    ])

    const columns = (columnsResult.results ?? []) as unknown as D1ColumnInfo[]
    const primaryKeys = columns
      .filter((col) => col.pk > 0)
      .sort((a, b) => a.pk - b.pk)
      .map((col) => col.name)

    return {
      table,
      columns,
      primaryKeys,
      indexes: indexesResult.results ?? [],
      foreignKeys: fkResult.results ?? [],
      rowCount: (countResult.results?.[0] as Record<string, unknown>)?.count as number ?? 0,
    }
  }

  async getRows(binding: string, table: string, opts: RowQueryOpts): Promise<RowsResult> {
    const dbId = await this.resolveDbId(binding)
    let sql = `SELECT * FROM "${table}"`
    if (opts.sort) {
      const dir = opts.direction === 'desc' ? 'DESC' : 'ASC'
      sql += ` ORDER BY "${opts.sort}" ${dir}`
    }
    sql += ` LIMIT ${opts.limit} OFFSET ${opts.offset}`

    const result = await this.executeQuery(dbId, sql)

    return {
      rows: (result.results ?? []) as Record<string, unknown>[],
      meta: {
        limit: opts.limit,
        offset: opts.offset,
        duration: result.meta?.duration,
      },
    }
  }

  async execute(binding: string, sql: string, params: unknown[] = []): Promise<QueryResult> {
    const dbId = await this.resolveDbId(binding)
    return this.executeQuery(dbId, sql, params)
  }

  async insertRow(binding: string, table: string, data: Record<string, unknown>): Promise<MutationResult> {
    const dbId = await this.resolveDbId(binding)
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(', ')
    const sql = `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`
    const result = await this.executeQuery(dbId, sql, Object.values(data))

    return {
      success: result.success,
      meta: result.meta,
    }
  }

  async updateRow(binding: string, table: string, rowId: string, data: Record<string, unknown>): Promise<MutationResult> {
    const dbId = await this.resolveDbId(binding)
    const tableInfo = await this.getTableInfo(binding, table)
    const pkCol = tableInfo.primaryKeys[0] ?? 'rowid'

    const setClauses = Object.keys(data).map(k => `"${k}" = ?`).join(', ')
    const sql = `UPDATE "${table}" SET ${setClauses} WHERE "${pkCol}" = ?`
    const result = await this.executeQuery(dbId, sql, [...Object.values(data), rowId])

    return { success: result.success, meta: result.meta }
  }

  async updateCell(binding: string, table: string, rowId: string, column: string, value: unknown): Promise<MutationResult> {
    return this.updateRow(binding, table, rowId, { [column]: value })
  }

  async deleteRow(binding: string, table: string, rowId: string): Promise<MutationResult> {
    const dbId = await this.resolveDbId(binding)
    const tableInfo = await this.getTableInfo(binding, table)
    const pkCol = tableInfo.primaryKeys[0] ?? 'rowid'

    const sql = `DELETE FROM "${table}" WHERE "${pkCol}" = ?`
    const result = await this.executeQuery(dbId, sql, [rowId])

    return { success: result.success, meta: result.meta }
  }

  async bulkDelete(binding: string, table: string, rowIds: RowIdentifier[]): Promise<BulkMutationResult> {
    const dbId = await this.resolveDbId(binding)
    const tableInfo = await this.getTableInfo(binding, table)
    const pkCol = tableInfo.primaryKeys[0] ?? 'rowid'

    const ids = rowIds.map(id => typeof id === 'string' ? id : Object.values(id)[0])
    const placeholders = ids.map(() => '?').join(', ')
    const sql = `DELETE FROM "${table}" WHERE "${pkCol}" IN (${placeholders})`
    const result = await this.executeQuery(dbId, sql, ids)

    return {
      success: result.success,
      meta: { changes: result.meta?.changes, rowsProcessed: ids.length },
    }
  }

  async bulkUpdate(binding: string, table: string, rowIds: RowIdentifier[], data: Record<string, unknown>): Promise<BulkMutationResult> {
    const dbId = await this.resolveDbId(binding)
    const tableInfo = await this.getTableInfo(binding, table)
    const pkCol = tableInfo.primaryKeys[0] ?? 'rowid'

    const ids = rowIds.map(id => typeof id === 'string' ? id : Object.values(id)[0])
    const setClauses = Object.keys(data).map(k => `"${k}" = ?`).join(', ')
    const placeholders = ids.map(() => '?').join(', ')
    const sql = `UPDATE "${table}" SET ${setClauses} WHERE "${pkCol}" IN (${placeholders})`
    const result = await this.executeQuery(dbId, sql, [...Object.values(data), ...ids])

    return {
      success: result.success,
      meta: { changes: result.meta?.changes, rowsProcessed: ids.length },
    }
  }

  private async resolveDbId(bindingOrId: string): Promise<string> {
    if (bindingOrId.includes('-') && bindingOrId.length > 30) {
      return bindingOrId
    }

    const cached = this.dbIdMap.get(bindingOrId)
    if (cached) return cached

    await this.listDatabases()
    const resolved = this.dbIdMap.get(bindingOrId)
    if (!resolved) {
      throw new Error(`Could not resolve D1 database: "${bindingOrId}". Make sure the database exists in your Cloudflare account.`)
    }
    return resolved
  }

  private async executeQuery(dbId: string, sql: string, params?: unknown[]): Promise<QueryResult> {
    const body: Record<string, unknown> = { sql }
    if (params?.length) body.params = params

    const result = await this.client.fetch<CFD1QueryResult[]>(
      `/d1/database/${dbId}/query`,
      { method: 'POST', body: JSON.stringify(body) }
    )

    const first = result[0]
    if (!first) {
      return { success: true, results: [], meta: { duration: 0 } }
    }

    return {
      success: first.success,
      results: first.results,
      rowCount: first.results?.length,
      meta: {
        changes: first.meta.changes,
        last_row_id: first.meta.last_row_id,
        duration: first.meta.duration,
      },
    }
  }
}
