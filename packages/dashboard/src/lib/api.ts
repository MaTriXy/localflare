/** @deprecated Use '@/datasources' and '@/hooks' instead. */
import { LocalClient } from '@/datasources/local/client'
import { LocalD1DataSource } from '@/datasources/local/d1'
import { LocalKVDataSource } from '@/datasources/local/kv'
import { LocalR2DataSource } from '@/datasources/local/r2'
import { LocalQueuesDataSource } from '@/datasources/local/queues'
import { LocalDODataSource } from '@/datasources/local/do'
import { LocalBindingsDataSource } from '@/datasources/local/bindings'
import { LocalLogsDataSource } from '@/datasources/local/logs'
import { LocalRequestsDataSource } from '@/datasources/local/requests'

export { getApiBase } from '@/datasources/local/client'

const client = new LocalClient()

const localD1 = new LocalD1DataSource(client)
const localKV = new LocalKVDataSource(client)
const localR2 = new LocalR2DataSource(client)
const localQueues = new LocalQueuesDataSource(client)
const localDO = new LocalDODataSource(client)
const localBindings = new LocalBindingsDataSource(client)
const localLogs = new LocalLogsDataSource(client)
const localRequests = new LocalRequestsDataSource(client)

/** @deprecated Use useDataSource().bindings instead */
export const bindingsApi = {
  getAll: () => localBindings.getAll(),
}

/** @deprecated Use useDataSource().d1 instead */
export const d1Api = {
  list: () => localD1.listDatabases().then((databases) => ({ databases })),
  getSchema: (binding: string) => localD1.getSchema(binding).then((tables) => ({ tables })),
  getTableInfo: (binding: string, table: string) => localD1.getTableInfo(binding, table),
  getRows: (binding: string, table: string, limit = 100, offset = 0, sort?: string, dir?: 'asc' | 'desc') =>
    localD1.getRows(binding, table, { limit, offset, sort, direction: dir }),
  query: (binding: string, sql: string, params: unknown[] = []) =>
    localD1.execute(binding, sql, params),
  insertRow: (binding: string, table: string, data: Record<string, unknown>) =>
    localD1.insertRow(binding, table, data),
  updateRow: (binding: string, table: string, rowId: string, data: Record<string, unknown>) =>
    localD1.updateRow(binding, table, rowId, data),
  updateCell: (binding: string, table: string, rowId: string, column: string, value: unknown) =>
    localD1.updateCell(binding, table, rowId, column, value),
  deleteRow: (binding: string, table: string, rowId: string) =>
    localD1.deleteRow(binding, table, rowId),
  bulkDelete: (binding: string, table: string, rowIds: (string | Record<string, unknown>)[]) =>
    localD1.bulkDelete(binding, table, rowIds),
  bulkUpdate: (binding: string, table: string, rowIds: (string | Record<string, unknown>)[], data: Record<string, unknown>) =>
    localD1.bulkUpdate(binding, table, rowIds, data),
}

/** @deprecated Use useDataSource().kv instead */
export const kvApi = {
  list: () => localKV.listNamespaces().then((namespaces) => ({ namespaces })),
  getKeys: (binding: string, prefix?: string, cursor?: string, limit = 100) =>
    localKV.listKeys(binding, { prefix, cursor, limit }),
  getValue: (binding: string, key: string, type = 'text') =>
    localKV.getValue(binding, key, type),
  setValue: (binding: string, key: string, value: string, metadata?: unknown, ttl?: number) =>
    localKV.setValue(binding, key, value, metadata, ttl).then(() => ({ success: true as const })),
  deleteKey: (binding: string, key: string) =>
    localKV.deleteKey(binding, key).then(() => ({ success: true as const })),
}

/** @deprecated Use useDataSource().r2 instead */
export const r2Api = {
  list: () => localR2.listBuckets().then((buckets) => ({ buckets })),
  getObjects: (binding: string, prefix?: string, cursor?: string, limit = 100) =>
    localR2.listObjects(binding, { prefix, cursor, limit }),
  getObjectMeta: (binding: string, key: string) =>
    localR2.getObjectMeta(binding, key),
  getObjectUrl: (binding: string, key: string): string =>
    localR2.getObjectUrl(binding, key)!,
  getObjectContent: (binding: string, key: string) =>
    localR2.getObjectContent(binding, key),
  deleteObject: (binding: string, key: string) =>
    localR2.deleteObject(binding, key).then(() => ({ success: true as const })),
  uploadObject: (binding: string, key: string, file: File) =>
    localR2.uploadObject(binding, key, file),
}

/** @deprecated Use useDataSource().queues instead */
export const queuesApi = {
  list: () => localQueues.listQueues(),
  send: (binding: string, message: unknown) =>
    localQueues.sendMessage(binding, message).then(() => ({ success: true as const })),
}

/** @deprecated Use useDataSource().do instead */
export const doApi = {
  list: () => localDO.listNamespaces().then((durableObjects) => ({ durableObjects })),
  getInstances: () => localDO.listInstances().then((instances) => ({ instances })),
  getId: (binding: string, options: { name?: string; id?: string }) =>
    localDO.getInstance(binding, options),
  fetch: async (binding: string, id: string, path: string, options?: RequestInit) => {
    const { getApiBase } = await import('@/datasources/local/client')
    const API_BASE = getApiBase()
    const response = await fetch(`${API_BASE}/do/${binding}/${id}/fetch${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    return response
  },
}

/** @deprecated Use useDataSource().logs instead */
export const logsApi = {
  getRecent: (limit = 100) => localLogs.getRecent(limit).then((logs) => ({ logs })),
  clear: () => localLogs.clear().then(() => ({ success: true as const })),
}

/** @deprecated Use useDataSource().requests instead */
export const requestsApi = {
  getAll: () => localRequests.getAll(),
  get: (id: string) => localRequests.get(id),
  clear: () => localRequests.clear().then(() => ({ success: true as const })),
}

export type {
  BindingsResponse,
  D1DatabaseInfo as D1Database,
  D1TableInfo as D1Table,
  D1ColumnInfo as D1Column,
  KVNamespaceInfo as KVNamespace,
  KVKeyInfo as KVKey,
  R2BucketInfo as R2Bucket,
  R2ObjectInfo as R2Object,
  QueueProducerInfo as QueueProducer,
  QueueConsumerInfo as QueueConsumer,
  DONamespaceInfo as DurableObject,
  DOInstanceInfo as DOInstance,
  LogEntry,
  CapturedRequest,
} from '@/datasources/types'
