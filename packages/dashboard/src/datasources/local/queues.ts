import type { QueuesDataSource, QueuesInfo } from '../types'
import type { LocalClient } from './client'

export class LocalQueuesDataSource implements QueuesDataSource {
  constructor(private readonly client: LocalClient) {}

  async listQueues(): Promise<QueuesInfo> {
    return this.client.fetch<QueuesInfo>('/queues')
  }

  async sendMessage(binding: string, message: unknown): Promise<void> {
    await this.client.fetch<{ success: boolean }>(`/queues/${binding}/send`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }
}
