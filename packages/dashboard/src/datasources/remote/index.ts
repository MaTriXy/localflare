import type {
  DataSource,
  LogsDataSource,
  RequestsDataSource,
  LogEntry,
  CapturedRequest,
  CloudflareCredentials,
} from '../types'
import { CloudflareClient } from './client'
import { RemoteD1DataSource } from './d1'
import { RemoteKVDataSource } from './kv'
import { RemoteR2DataSource } from './r2'
import { RemoteQueuesDataSource } from './queues'
import { RemoteDODataSource } from './do'
import { RemoteBindingsDataSource } from './bindings'

/** Logs/requests are local-only; these return empty results in remote mode. */
class NoopLogsDataSource implements LogsDataSource {
  async getRecent(_limit?: number): Promise<LogEntry[]> {
    return []
  }
  async clear(): Promise<void> {}
}

class NoopRequestsDataSource implements RequestsDataSource {
  async getAll(): Promise<{ requests: CapturedRequest[]; total: number }> {
    return { requests: [], total: 0 }
  }
  async get(_id: string): Promise<CapturedRequest> {
    throw new Error('Request inspection is only available in local mode.')
  }
  async clear(): Promise<void> {}
}

export class RemoteDataSource implements DataSource {
  readonly mode = 'remote' as const
  readonly bindings: RemoteBindingsDataSource
  readonly d1: RemoteD1DataSource
  readonly kv: RemoteKVDataSource
  readonly r2: RemoteR2DataSource
  readonly queues: RemoteQueuesDataSource
  readonly do: RemoteDODataSource
  readonly logs: LogsDataSource
  readonly requests: RequestsDataSource

  constructor(credentials: CloudflareCredentials) {
    const client = new CloudflareClient(credentials)
    this.bindings = new RemoteBindingsDataSource(client)
    this.d1 = new RemoteD1DataSource(client)
    this.kv = new RemoteKVDataSource(client)
    this.r2 = new RemoteR2DataSource(client, credentials)
    this.queues = new RemoteQueuesDataSource(client)
    this.do = new RemoteDODataSource(client)
    this.logs = new NoopLogsDataSource()
    this.requests = new NoopRequestsDataSource()
  }
}

export { CloudflareClient } from './client'
