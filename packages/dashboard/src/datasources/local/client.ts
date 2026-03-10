/** Communicates with the LocalFlare sidecar worker. */
export function getApiBase(): string {
  const isHostedMode =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'studio.localflare.dev' ||
      (window.location.hostname === 'localhost' && window.location.port === '5174'))

  if (isHostedMode) {
    const params = new URLSearchParams(window.location.search)
    const port = params.get('port') || '8788'
    return `http://localhost:${port}/__localflare`
  }

  return '/__localflare'
}

export class LocalClient {
  private readonly baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getApiBase()
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async fetchRaw(endpoint: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response
  }
}
