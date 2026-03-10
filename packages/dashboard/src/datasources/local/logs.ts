import type { LogsDataSource, LogEntry } from '../types'
import type { LocalClient } from './client'

export class LocalLogsDataSource implements LogsDataSource {
  constructor(private readonly client: LocalClient) {}

  async getRecent(limit = 100): Promise<LogEntry[]> {
    const res = await this.client.fetch<{ logs: LogEntry[] }>(`/logs?limit=${limit}`)
    return res.logs
  }

  async clear(): Promise<void> {
    await this.client.fetch<{ success: boolean }>('/logs', { method: 'DELETE' })
  }
}
