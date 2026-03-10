/** Object operations require S3-compatible auth (not yet implemented). */
import type {
  R2DataSource,
  R2BucketInfo,
  R2ObjectInfo,
  ListObjectsOpts,
  ObjectListResult,
  UploadResult,
} from '../types'
import type { CloudflareClient } from './client'

interface CFR2Bucket {
  name: string
  creation_date: string
  location?: string
  storage_class?: string
}

export class RemoteR2DataSource implements R2DataSource {
  constructor(private readonly client: CloudflareClient) {}

  async listBuckets(): Promise<R2BucketInfo[]> {
    const result = await this.client.fetch<{ buckets: CFR2Bucket[] }>('/r2/buckets')

    return result.buckets.map((bucket): R2BucketInfo => ({
      binding: bucket.name,
      bucket_name: bucket.name,
    }))
  }

  async listObjects(_binding: string, _opts?: ListObjectsOpts): Promise<ObjectListResult> {
    throw new Error(
      'R2 object listing via remote mode requires S3-compatible API credentials. This feature is coming soon.'
    )
  }

  async getObjectMeta(_binding: string, _key: string): Promise<R2ObjectInfo> {
    throw new Error(
      'R2 object metadata via remote mode requires S3-compatible API credentials. This feature is coming soon.'
    )
  }

  getObjectUrl(_binding: string, _key: string): string | null {
    return null
  }

  async getObjectContent(_binding: string, _key: string): Promise<Response> {
    throw new Error(
      'R2 object download via remote mode requires S3-compatible API credentials. This feature is coming soon.'
    )
  }

  async uploadObject(_binding: string, _key: string, _file: File): Promise<UploadResult> {
    throw new Error(
      'R2 object upload via remote mode requires S3-compatible API credentials. This feature is coming soon.'
    )
  }

  async deleteObject(_binding: string, _key: string): Promise<void> {
    throw new Error(
      'R2 object deletion via remote mode requires S3-compatible API credentials. This feature is coming soon.'
    )
  }
}
