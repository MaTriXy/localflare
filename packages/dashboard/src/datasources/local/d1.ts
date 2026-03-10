import type {
  D1DataSource,
  D1DatabaseInfo,
  D1TableInfo,
  D1TableDetail,
  RowQueryOpts,
  RowsResult,
  QueryResult,
  MutationResult,
  BulkMutationResult,
  RowIdentifier,
} from '../types'
import type { LocalClient } from './client'

export class LocalD1DataSource implements D1DataSource {
  constructor(private readonly client: LocalClient) {}

  async listDatabases(): Promise<D1DatabaseInfo[]> {
    const res = await this.client.fetch<{ databases: D1DatabaseInfo[] }>('/d1')
    return res.databases
  }

  async getSchema(binding: string): Promise<D1TableInfo[]> {
    const res = await this.client.fetch<{ tables: D1TableInfo[] }>(`/d1/${binding}/schema`)
    return res.tables
  }

  async getTableInfo(binding: string, table: string): Promise<D1TableDetail> {
    return this.client.fetch<D1TableDetail>(`/d1/${binding}/tables/${table}`)
  }

  async getRows(binding: string, table: string, opts: RowQueryOpts): Promise<RowsResult> {
    const params = new URLSearchParams({
      limit: String(opts.limit),
      offset: String(opts.offset),
    })
    if (opts.sort) params.set('sort', opts.sort)
    if (opts.direction) params.set('dir', opts.direction)

    return this.client.fetch<RowsResult>(`/d1/${binding}/tables/${table}/rows?${params}`)
  }

  async execute(binding: string, sql: string, params: unknown[] = []): Promise<QueryResult> {
    return this.client.fetch<QueryResult>(`/d1/${binding}/query`, {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    })
  }

  async insertRow(binding: string, table: string, data: Record<string, unknown>): Promise<MutationResult> {
    return this.client.fetch<MutationResult>(`/d1/${binding}/tables/${table}/rows`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRow(binding: string, table: string, rowId: string, data: Record<string, unknown>): Promise<MutationResult> {
    return this.client.fetch<MutationResult>(`/d1/${binding}/tables/${table}/rows/${encodeURIComponent(rowId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateCell(binding: string, table: string, rowId: string, column: string, value: unknown): Promise<MutationResult> {
    return this.client.fetch<MutationResult>(`/d1/${binding}/tables/${table}/rows/${encodeURIComponent(rowId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ column, value }),
    })
  }

  async deleteRow(binding: string, table: string, rowId: string): Promise<MutationResult> {
    return this.client.fetch<MutationResult>(`/d1/${binding}/tables/${table}/rows/${encodeURIComponent(rowId)}`, {
      method: 'DELETE',
    })
  }

  async bulkDelete(binding: string, table: string, rowIds: RowIdentifier[]): Promise<BulkMutationResult> {
    return this.client.fetch<BulkMutationResult>(`/d1/${binding}/tables/${table}/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ rowIds }),
    })
  }

  async bulkUpdate(binding: string, table: string, rowIds: RowIdentifier[], data: Record<string, unknown>): Promise<BulkMutationResult> {
    return this.client.fetch<BulkMutationResult>(`/d1/${binding}/tables/${table}/bulk-update`, {
      method: 'POST',
      body: JSON.stringify({ rowIds, data }),
    })
  }
}
