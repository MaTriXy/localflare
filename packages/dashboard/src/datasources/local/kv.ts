import type {
  KVDataSource,
  KVNamespaceInfo,
  ListKeysOpts,
  KeyListResult,
  KVValueResult,
} from '../types'
import type { LocalClient } from './client'

export class LocalKVDataSource implements KVDataSource {
  constructor(private readonly client: LocalClient) {}

  async listNamespaces(): Promise<KVNamespaceInfo[]> {
    const res = await this.client.fetch<{ namespaces: KVNamespaceInfo[] }>('/kv')
    return res.namespaces
  }

  async listKeys(binding: string, opts?: ListKeysOpts): Promise<KeyListResult> {
    const params = new URLSearchParams({ limit: String(opts?.limit ?? 100) })
    if (opts?.prefix) params.set('prefix', opts.prefix)
    if (opts?.cursor) params.set('cursor', opts.cursor)

    return this.client.fetch<KeyListResult>(`/kv/${binding}/keys?${params}`)
  }

  async getValue(binding: string, key: string, type = 'text'): Promise<KVValueResult> {
    return this.client.fetch<KVValueResult>(
      `/kv/${binding}/keys/${encodeURIComponent(key)}?type=${type}`
    )
  }

  async setValue(binding: string, key: string, value: string, metadata?: unknown, ttl?: number): Promise<void> {
    await this.client.fetch<{ success: boolean }>(`/kv/${binding}/keys/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value, metadata, expirationTtl: ttl }),
    })
  }

  async deleteKey(binding: string, key: string): Promise<void> {
    await this.client.fetch<{ success: boolean }>(`/kv/${binding}/keys/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    })
  }
}
