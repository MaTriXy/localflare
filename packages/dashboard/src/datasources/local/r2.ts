import type {
  R2DataSource,
  R2BucketInfo,
  R2ObjectInfo,
  ListObjectsOpts,
  ObjectListResult,
  UploadResult,
} from '../types'
import type { LocalClient } from './client'

export class LocalR2DataSource implements R2DataSource {
  constructor(private readonly client: LocalClient) {}

  async listBuckets(): Promise<R2BucketInfo[]> {
    const res = await this.client.fetch<{ buckets: R2BucketInfo[] }>('/r2')
    return res.buckets
  }

  async listObjects(binding: string, opts?: ListObjectsOpts): Promise<ObjectListResult> {
    const params = new URLSearchParams({ limit: String(opts?.limit ?? 100) })
    if (opts?.prefix) params.set('prefix', opts.prefix)
    if (opts?.cursor) params.set('cursor', opts.cursor)

    return this.client.fetch<ObjectListResult>(`/r2/${binding}/objects?${params}`)
  }

  async getObjectMeta(binding: string, key: string): Promise<R2ObjectInfo> {
    return this.client.fetch<R2ObjectInfo>(`/r2/${binding}/objects/${encodeURIComponent(key)}/meta`)
  }

  getObjectUrl(binding: string, key: string): string | null {
    return `${this.client.getBaseUrl()}/r2/${binding}/objects/${encodeURIComponent(key)}`
  }

  async getObjectContent(binding: string, key: string): Promise<Response> {
    return this.client.fetchRaw(`/r2/${binding}/objects/${encodeURIComponent(key)}`)
  }

  async uploadObject(binding: string, key: string, file: File): Promise<UploadResult> {
    const response = await fetch(
      `${this.client.getBaseUrl()}/r2/${binding}/objects/${encodeURIComponent(key)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json() as Promise<UploadResult>
  }

  async deleteObject(binding: string, key: string): Promise<void> {
    await this.client.fetch<{ success: boolean }>(`/r2/${binding}/objects/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    })
  }
}
