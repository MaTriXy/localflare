import type { RequestsDataSource, CapturedRequest } from '../types'
import type { LocalClient } from './client'

export class LocalRequestsDataSource implements RequestsDataSource {
  constructor(private readonly client: LocalClient) {}

  async getAll(): Promise<{ requests: CapturedRequest[]; total: number }> {
    return this.client.fetch<{ requests: CapturedRequest[]; total: number }>('/requests')
  }

  async get(id: string): Promise<CapturedRequest> {
    return this.client.fetch<CapturedRequest>(`/requests/${id}`)
  }

  async clear(): Promise<void> {
    await this.client.fetch<{ success: boolean }>('/requests', { method: 'DELETE' })
  }
}
