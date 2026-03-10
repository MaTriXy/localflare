import type { BindingsDataSource, BindingsResponse } from '../types'
import type { CloudflareClient } from './client'

export class RemoteBindingsDataSource implements BindingsDataSource {
  constructor(private readonly client: CloudflareClient) {}

  async getAll(): Promise<BindingsResponse> {
    const [d1Databases, kvNamespaces, r2Buckets, queues, doNamespaces] = await Promise.allSettled([
      this.client.fetch<{ uuid: string; name: string }[]>('/d1/database').catch(() => []),
      this.client.fetch<{ id: string; title: string }[]>('/storage/kv/namespaces').catch(() => []),
      this.client.fetch<{ buckets: { name: string }[] }>('/r2/buckets').catch(() => ({ buckets: [] })),
      this.client.fetch<{ queue_id: string; queue_name: string }[]>('/queues').catch(() => []),
      this.client.fetch<{ id: string; name: string; class: string; script: string }[]>('/workers/durable_objects/namespaces').catch(() => []),
    ])

    const d1 = (d1Databases.status === 'fulfilled' ? d1Databases.value : []) as { uuid: string; name: string }[]
    const kv = (kvNamespaces.status === 'fulfilled' ? kvNamespaces.value : []) as { id: string; title: string }[]
    const r2Result = (r2Buckets.status === 'fulfilled' ? r2Buckets.value : { buckets: [] }) as { buckets: { name: string }[] }
    const q = (queues.status === 'fulfilled' ? queues.value : []) as { queue_id: string; queue_name: string }[]
    const doNs = (doNamespaces.status === 'fulfilled' ? doNamespaces.value : []) as { id: string; name: string; class: string; script: string }[]

    return {
      name: 'Cloudflare Account',
      bindings: {
        d1: d1.map((db) => ({
          type: 'd1',
          binding: db.name,
          database_name: db.name,
          database_id: db.uuid,
        })),
        kv: kv.map((ns) => ({
          type: 'kv',
          binding: ns.title,
          id: ns.id,
        })),
        r2: r2Result.buckets.map((bucket) => ({
          type: 'r2',
          binding: bucket.name,
          bucket_name: bucket.name,
        })),
        durableObjects: doNs.map((ns) => ({
          type: 'durable_object',
          name: ns.name,
          binding: ns.name,
          class_name: ns.class,
          script_name: ns.script,
        })),
        queues: {
          producers: q.map((queue) => ({
            type: 'queue',
            binding: queue.queue_name,
            queue: queue.queue_name,
          })),
          consumers: [],
        },
        vars: [],
      },
    }
  }
}
