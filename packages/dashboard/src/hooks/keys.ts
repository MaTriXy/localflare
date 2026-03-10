/** Query keys include the datasource mode so local/remote caches stay independent. */
import type { DataSourceMode } from '@/datasources'

export const queryKeys = {
  bindings: {
    all: (mode: DataSourceMode) => ['bindings', mode] as const,
  },

  d1: {
    all: (mode: DataSourceMode) => ['d1', mode] as const,
    databases: (mode: DataSourceMode) => [...queryKeys.d1.all(mode), 'databases'] as const,
    schema: (mode: DataSourceMode, binding: string) =>
      [...queryKeys.d1.all(mode), 'schema', binding] as const,
    allSchemas: (mode: DataSourceMode, binding: string, tables: string) =>
      [...queryKeys.d1.all(mode), 'all-schemas', binding, tables] as const,
    tableInfo: (mode: DataSourceMode, binding: string, table: string) =>
      [...queryKeys.d1.all(mode), 'table-info', binding, table] as const,
    tableRows: (
      mode: DataSourceMode,
      binding: string,
      table: string,
      page: number,
      pageSize: number,
      orderBy?: string,
      orderDir?: 'asc' | 'desc'
    ) =>
      [...queryKeys.d1.all(mode), 'rows', binding, table, page, pageSize, orderBy, orderDir] as const,
  },

  kv: {
    all: (mode: DataSourceMode) => ['kv', mode] as const,
    namespaces: (mode: DataSourceMode) => [...queryKeys.kv.all(mode), 'namespaces'] as const,
    keys: (mode: DataSourceMode, binding: string, prefix?: string) =>
      [...queryKeys.kv.all(mode), 'keys', binding, prefix] as const,
    value: (mode: DataSourceMode, binding: string, key: string) =>
      [...queryKeys.kv.all(mode), 'value', binding, key] as const,
  },

  r2: {
    all: (mode: DataSourceMode) => ['r2', mode] as const,
    buckets: (mode: DataSourceMode) => [...queryKeys.r2.all(mode), 'buckets'] as const,
    objects: (mode: DataSourceMode, binding: string, prefix?: string) =>
      [...queryKeys.r2.all(mode), 'objects', binding, prefix] as const,
    objectMeta: (mode: DataSourceMode, binding: string, key: string) =>
      [...queryKeys.r2.all(mode), 'object-meta', binding, key] as const,
  },

  queues: {
    all: (mode: DataSourceMode) => ['queues', mode] as const,
    list: (mode: DataSourceMode) => [...queryKeys.queues.all(mode), 'list'] as const,
  },

  do: {
    all: (mode: DataSourceMode) => ['do', mode] as const,
    namespaces: (mode: DataSourceMode) => [...queryKeys.do.all(mode), 'namespaces'] as const,
    instances: (mode: DataSourceMode) => [...queryKeys.do.all(mode), 'instances'] as const,
  },

  logs: {
    all: (mode: DataSourceMode) => ['logs', mode] as const,
    recent: (mode: DataSourceMode, limit: number) =>
      [...queryKeys.logs.all(mode), 'recent', limit] as const,
  },

  requests: {
    all: (mode: DataSourceMode) => ['requests', mode] as const,
    list: (mode: DataSourceMode) => [...queryKeys.requests.all(mode), 'list'] as const,
    detail: (mode: DataSourceMode, id: string) =>
      [...queryKeys.requests.all(mode), 'detail', id] as const,
  },
} as const
