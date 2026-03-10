import type {
  KVDataSource,
  KVNamespaceInfo,
  ListKeysOpts,
  KeyListResult,
  KVValueResult,
} from '../types'
import type { CloudflareClient } from './client'

interface CFKVNamespace {
  id: string
  title: string
  supports_url_encoding: boolean
}

interface CFKVKey {
  name: string
  expiration?: number
  metadata?: unknown
}

export class RemoteKVDataSource implements KVDataSource {
  private nsIdMap = new Map<string, string>()

  constructor(private readonly client: CloudflareClient) {}

  async listNamespaces(): Promise<KVNamespaceInfo[]> {
    const result = await this.client.fetch<CFKVNamespace[]>('/storage/kv/namespaces')

    return result.map((ns): KVNamespaceInfo => {
      this.nsIdMap.set(ns.title, ns.id)
      this.nsIdMap.set(ns.id, ns.id)
      return {
        binding: ns.title,
        id: ns.id,
      }
    })
  }

  async listKeys(binding: string, opts?: ListKeysOpts): Promise<KeyListResult> {
    const nsId = await this.resolveNsId(binding)
    const params = new URLSearchParams()
    if (opts?.limit) params.set('limit', String(opts.limit))
    if (opts?.prefix) params.set('prefix', opts.prefix)
    if (opts?.cursor) params.set('cursor', opts.cursor)

    const queryString = params.toString()
    const endpoint = `/storage/kv/namespaces/${nsId}/keys${queryString ? `?${queryString}` : ''}`
    const { data, resultInfo } = await this.client.fetchPaged<CFKVKey[]>(endpoint)

    return {
      keys: data.map((key) => ({
        name: key.name,
        expiration: key.expiration,
        metadata: key.metadata,
      })),
      cursor: resultInfo?.cursor,
      list_complete: !resultInfo?.cursor,
    }
  }

  async getValue(binding: string, key: string, type = 'text'): Promise<KVValueResult> {
    const nsId = await this.resolveNsId(binding)
    const response = await this.client.fetchRaw(
      `/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`
    )

    let value: unknown
    if (type === 'json') {
      value = await response.json()
    } else {
      value = await response.text()
    }

    return { key, value }
  }

  async setValue(binding: string, key: string, value: string, metadata?: unknown, ttl?: number): Promise<void> {
    const nsId = await this.resolveNsId(binding)
    const params = new URLSearchParams()
    if (ttl) params.set('expiration_ttl', String(ttl))

    const queryString = params.toString()
    const endpoint = `/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}${queryString ? `?${queryString}` : ''}`

    const formData = new FormData()
    formData.append('value', value)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    await this.client.fetchRaw(endpoint, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${(this.client as unknown as { apiToken: string }).apiToken}`,
      },
    })
  }

  async deleteKey(binding: string, key: string): Promise<void> {
    const nsId = await this.resolveNsId(binding)
    await this.client.fetch<Record<string, never>>(
      `/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`,
      { method: 'DELETE' }
    )
  }

  private async resolveNsId(bindingOrId: string): Promise<string> {
    if (/^[0-9a-f]{32}$/i.test(bindingOrId)) {
      return bindingOrId
    }

    const cached = this.nsIdMap.get(bindingOrId)
    if (cached) return cached

    await this.listNamespaces()
    const resolved = this.nsIdMap.get(bindingOrId)
    if (!resolved) {
      throw new Error(`Could not resolve KV namespace: "${bindingOrId}". Make sure the namespace exists in your Cloudflare account.`)
    }
    return resolved
  }
}
