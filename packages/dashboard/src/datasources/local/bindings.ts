import type { BindingsDataSource, BindingsResponse } from '../types'
import type { LocalClient } from './client'

export class LocalBindingsDataSource implements BindingsDataSource {
  constructor(private readonly client: LocalClient) {}

  async getAll(): Promise<BindingsResponse> {
    return this.client.fetch<BindingsResponse>('/bindings')
  }
}
