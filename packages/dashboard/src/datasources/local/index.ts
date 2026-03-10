import type { DataSource } from '../types'
import { LocalClient } from './client'
import { LocalD1DataSource } from './d1'
import { LocalKVDataSource } from './kv'
import { LocalR2DataSource } from './r2'
import { LocalQueuesDataSource } from './queues'
import { LocalDODataSource } from './do'
import { LocalBindingsDataSource } from './bindings'
import { LocalLogsDataSource } from './logs'
import { LocalRequestsDataSource } from './requests'

export class LocalDataSource implements DataSource {
  readonly mode = 'local' as const
  readonly bindings: LocalBindingsDataSource
  readonly d1: LocalD1DataSource
  readonly kv: LocalKVDataSource
  readonly r2: LocalR2DataSource
  readonly queues: LocalQueuesDataSource
  readonly do: LocalDODataSource
  readonly logs: LocalLogsDataSource
  readonly requests: LocalRequestsDataSource

  constructor(client?: LocalClient) {
    const c = client ?? new LocalClient()
    this.bindings = new LocalBindingsDataSource(c)
    this.d1 = new LocalD1DataSource(c)
    this.kv = new LocalKVDataSource(c)
    this.r2 = new LocalR2DataSource(c)
    this.queues = new LocalQueuesDataSource(c)
    this.do = new LocalDODataSource(c)
    this.logs = new LocalLogsDataSource(c)
    this.requests = new LocalRequestsDataSource(c)
  }
}

export { LocalClient } from './client'
