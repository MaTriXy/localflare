import type { DataSource, DataSourceMode, CloudflareCredentials } from './types'
import { LocalDataSource } from './local'
import { RemoteDataSource } from './remote'

export function createDataSource(
  mode: DataSourceMode,
  credentials: CloudflareCredentials | null
): DataSource {
  if (mode === 'remote') {
    if (!credentials) {
      throw new Error('Cloudflare credentials are required for remote mode.')
    }
    return new RemoteDataSource(credentials)
  }

  return new LocalDataSource()
}
