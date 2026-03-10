import type {
  DODataSource,
  DONamespaceInfo,
  DOInstanceInfo,
  DOFetchResult,
} from '../types'
import type { LocalClient } from './client'

export class LocalDODataSource implements DODataSource {
  constructor(private readonly client: LocalClient) {}

  async listNamespaces(): Promise<DONamespaceInfo[]> {
    const res = await this.client.fetch<{ durableObjects: DONamespaceInfo[] }>('/do')
    return res.durableObjects
  }

  async listInstances(): Promise<DOInstanceInfo[]> {
    const res = await this.client.fetch<{ instances: DOInstanceInfo[] }>('/do/instances')
    return res.instances
  }

  async getInstance(binding: string, opts: { name?: string; id?: string }): Promise<{ id: string }> {
    return this.client.fetch<{ id: string }>(`/do/${binding}/id`, {
      method: 'POST',
      body: JSON.stringify(opts),
    })
  }

  async fetch(binding: string, id: string, path: string, opts?: RequestInit): Promise<DOFetchResult> {
    const response = await this.client.fetchRaw(`/do/${binding}/${id}/fetch${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...opts?.headers,
      },
    })

    const body = await response.text()
    return { status: response.status, body }
  }
}
