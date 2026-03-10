import type { QueuesDataSource, QueuesInfo } from '../types'
import type { CloudflareClient } from './client'

interface CFQueue {
  queue_id: string
  queue_name: string
  created_on: string
  modified_on: string
  producers: { type: string; script: string }[]
  producers_total_count: number
  consumers: {
    consumer_id: string
    script_name: string
    type: string
    dead_letter_queue?: string
    settings: {
      batch_size: number
      max_concurrency: number
      max_retries: number
      max_wait_time_ms: number
      retry_delay?: number
    }
  }[]
  consumers_total_count: number
}

export class RemoteQueuesDataSource implements QueuesDataSource {
  private queueIdMap = new Map<string, string>()

  constructor(private readonly client: CloudflareClient) {}

  async listQueues(): Promise<QueuesInfo> {
    const result = await this.client.fetch<CFQueue[]>('/queues')

    const producers = result.map((q) => {
      this.queueIdMap.set(q.queue_name, q.queue_id)
      return {
        binding: q.queue_name,
        queue: q.queue_name,
      }
    })

    const consumers = result.flatMap((q) =>
      q.consumers.map((c) => ({
        queue: q.queue_name,
        max_batch_size: c.settings.batch_size,
        max_batch_timeout: c.settings.max_wait_time_ms,
        max_retries: c.settings.max_retries,
        dead_letter_queue: c.dead_letter_queue,
      }))
    )

    return { producers, consumers }
  }

  async sendMessage(binding: string, message: unknown): Promise<void> {
    const queueId = await this.resolveQueueId(binding)
    await this.client.fetch<Record<string, never>>(`/queues/${queueId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: message }),
    })
  }

  private async resolveQueueId(bindingOrName: string): Promise<string> {
    const cached = this.queueIdMap.get(bindingOrName)
    if (cached) return cached

    await this.listQueues()
    const resolved = this.queueIdMap.get(bindingOrName)
    if (!resolved) {
      throw new Error(`Could not resolve Queue: "${bindingOrName}". Make sure the queue exists in your Cloudflare account.`)
    }
    return resolved
  }
}
