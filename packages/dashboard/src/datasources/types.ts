// ─── Mode & Auth ────────────────────────────────────────────────────────────

export type DataSourceMode = 'local' | 'remote'

export interface CloudflareCredentials {
  apiToken: string
  accountId: string
  /** R2 Access Key ID for S3-compatible operations. Optional — only needed for R2 object ops. */
  r2AccessKeyId?: string
}

// ─── Shared Types ───────────────────────────────────────────────────────────

export interface MutationResult {
  success: boolean
  meta?: {
    changes?: number
    last_row_id?: number
    duration?: number
  }
}

export interface BulkMutationResult {
  success: boolean
  meta?: {
    changes?: number
    rowsProcessed?: number
  }
}

// ─── D1 Types ───────────────────────────────────────────────────────────────

export interface D1DatabaseInfo {
  binding: string
  database_name: string
  database_id: string
}

export interface D1TableInfo {
  name: string
  sql: string
}

export interface D1ColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: unknown
  pk: number
}

export interface D1TableDetail {
  table: string
  columns: D1ColumnInfo[]
  primaryKeys: string[]
  indexes: unknown[]
  foreignKeys: unknown[]
  rowCount: number
}

export interface RowQueryOpts {
  limit: number
  offset: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export interface RowsResult {
  rows: Record<string, unknown>[]
  meta: {
    limit: number
    offset: number
    duration?: number
  }
}

export interface QueryResult {
  success: boolean
  results?: unknown[]
  rowCount?: number
  meta?: {
    changes?: number
    last_row_id?: number
    duration?: number
  }
}

export type RowIdentifier = string | Record<string, unknown>

// ─── KV Types ───────────────────────────────────────────────────────────────

export interface KVNamespaceInfo {
  binding: string
  id: string
}

export interface KVKeyInfo {
  name: string
  expiration?: number
  metadata?: unknown
}

export interface ListKeysOpts {
  prefix?: string
  cursor?: string
  limit?: number
}

export interface KeyListResult {
  keys: KVKeyInfo[]
  cursor?: string
  list_complete: boolean
}

export interface KVValueResult {
  key: string
  value: unknown
  metadata?: unknown
}

// ─── R2 Types ───────────────────────────────────────────────────────────────

export interface R2BucketInfo {
  binding: string
  bucket_name: string
}

export interface R2ObjectInfo {
  key: string
  size: number
  etag: string
  httpEtag: string
  uploaded: string
  checksums?: unknown
  customMetadata?: Record<string, string>
  httpMetadata?: {
    contentType?: string
    contentDisposition?: string
  }
}

export interface ListObjectsOpts {
  prefix?: string
  cursor?: string
  limit?: number
}

export interface ObjectListResult {
  objects: R2ObjectInfo[]
  truncated: boolean
  cursor?: string
}

export interface UploadResult {
  success: boolean
  key: string
  size: number
  etag: string
}

// ─── Queue Types ────────────────────────────────────────────────────────────

export interface QueueProducerInfo {
  binding: string
  queue: string
}

export interface QueueConsumerInfo {
  queue: string
  max_batch_size: number
  max_batch_timeout: number
  max_retries: number
  dead_letter_queue?: string
}

export interface QueuesInfo {
  producers: QueueProducerInfo[]
  consumers: QueueConsumerInfo[]
}

// ─── Durable Objects Types ──────────────────────────────────────────────────

export interface DONamespaceInfo {
  name: string
  class_name: string
  script_name?: string
}

export interface DOInstanceInfo extends Record<string, unknown> {
  binding: string
  class_name: string
  id: string
}

export interface DOFetchResult {
  status: number
  body: string
}

// ─── Bindings Types ─────────────────────────────────────────────────────────

export interface BindingsResponse {
  name: string
  bindings: {
    d1: { type: string; binding: string; database_name: string; database_id?: string }[]
    kv: { type: string; binding: string; id?: string }[]
    r2: { type: string; binding: string; bucket_name: string }[]
    durableObjects: { type: string; name: string; binding: string; class_name: string; script_name?: string }[]
    queues: {
      producers: { type: string; binding: string; queue: string }[]
      consumers: { type: string; queue: string }[]
    }
    vars: { type: string; key: string; value: string; isSecret: boolean }[]
  }
}

// ─── Logs & Requests (local-only) ───────────────────────────────────────────

export interface LogEntry {
  id: string
  timestamp: string
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  source: 'worker' | 'queue' | 'do' | 'system' | 'request'
  message: string
  data?: unknown
}

export interface CapturedRequest {
  id: string
  timestamp: string
  method: string
  url: string
  path: string
  headers: Record<string, string>
  body?: string
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    body?: string
    duration: number
  }
}

// ─── DataSource Interfaces ──────────────────────────────────────────────────

export interface D1DataSource {
  listDatabases(): Promise<D1DatabaseInfo[]>
  getSchema(binding: string): Promise<D1TableInfo[]>
  getTableInfo(binding: string, table: string): Promise<D1TableDetail>
  getRows(binding: string, table: string, opts: RowQueryOpts): Promise<RowsResult>
  execute(binding: string, sql: string, params?: unknown[]): Promise<QueryResult>
  insertRow(binding: string, table: string, data: Record<string, unknown>): Promise<MutationResult>
  updateRow(binding: string, table: string, rowId: string, data: Record<string, unknown>): Promise<MutationResult>
  updateCell(binding: string, table: string, rowId: string, column: string, value: unknown): Promise<MutationResult>
  deleteRow(binding: string, table: string, rowId: string): Promise<MutationResult>
  bulkDelete(binding: string, table: string, rowIds: RowIdentifier[]): Promise<BulkMutationResult>
  bulkUpdate(binding: string, table: string, rowIds: RowIdentifier[], data: Record<string, unknown>): Promise<BulkMutationResult>
}

export interface KVDataSource {
  listNamespaces(): Promise<KVNamespaceInfo[]>
  listKeys(binding: string, opts?: ListKeysOpts): Promise<KeyListResult>
  getValue(binding: string, key: string, type?: string): Promise<KVValueResult>
  setValue(binding: string, key: string, value: string, metadata?: unknown, ttl?: number): Promise<void>
  deleteKey(binding: string, key: string): Promise<void>
}

export interface R2DataSource {
  listBuckets(): Promise<R2BucketInfo[]>
  listObjects(binding: string, opts?: ListObjectsOpts): Promise<ObjectListResult>
  getObjectMeta(binding: string, key: string): Promise<R2ObjectInfo>
  getObjectUrl(binding: string, key: string): string | null
  getObjectContent(binding: string, key: string): Promise<Response>
  uploadObject(binding: string, key: string, file: File): Promise<UploadResult>
  deleteObject(binding: string, key: string): Promise<void>
}

export interface QueuesDataSource {
  listQueues(): Promise<QueuesInfo>
  sendMessage(binding: string, message: unknown): Promise<void>
}

export interface DODataSource {
  listNamespaces(): Promise<DONamespaceInfo[]>
  listInstances(): Promise<DOInstanceInfo[]>
  getInstance(binding: string, opts: { name?: string; id?: string }): Promise<{ id: string }>
  fetch(binding: string, id: string, path: string, opts?: RequestInit): Promise<DOFetchResult>
}

export interface BindingsDataSource {
  getAll(): Promise<BindingsResponse>
}

export interface LogsDataSource {
  getRecent(limit?: number): Promise<LogEntry[]>
  clear(): Promise<void>
}

export interface RequestsDataSource {
  getAll(): Promise<{ requests: CapturedRequest[]; total: number }>
  get(id: string): Promise<CapturedRequest>
  clear(): Promise<void>
}

// ─── Composite DataSource ───────────────────────────────────────────────────

export interface DataSource {
  readonly mode: DataSourceMode
  readonly bindings: BindingsDataSource
  readonly d1: D1DataSource
  readonly kv: KVDataSource
  readonly r2: R2DataSource
  readonly queues: QueuesDataSource
  readonly do: DODataSource
  readonly logs: LogsDataSource
  readonly requests: RequestsDataSource
}
