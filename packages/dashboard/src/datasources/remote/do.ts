import type {
  DODataSource,
  DONamespaceInfo,
  DOInstanceInfo,
  DOFetchResult,
} from '../types'
import type { CloudflareClient } from './client'

interface CFDONamespace {
  id: string
  name: string
  class: string
  script: string
  use_sqlite?: boolean
}

interface CFDOObject {
  id: string
  hasStoredData: boolean
}

export class RemoteDODataSource implements DODataSource {
  private nsIdMap = new Map<string, string>()

  constructor(private readonly client: CloudflareClient) {}

  async listNamespaces(): Promise<DONamespaceInfo[]> {
    const result = await this.client.fetch<CFDONamespace[]>(
      '/workers/durable_objects/namespaces'
    )

    return result.map((ns): DONamespaceInfo => {
      this.nsIdMap.set(ns.name, ns.id)
      this.nsIdMap.set(ns.class, ns.id)
      return {
        name: ns.name,
        class_name: ns.class,
        script_name: ns.script,
      }
    })
  }

  async listInstances(): Promise<DOInstanceInfo[]> {
    const namespaces = await this.listNamespaces()
    const instances: DOInstanceInfo[] = []

    for (const ns of namespaces) {
      const nsId = this.nsIdMap.get(ns.name) ?? this.nsIdMap.get(ns.class_name)
      if (!nsId) continue

      try {
        const result = await this.client.fetch<CFDOObject[]>(
          `/workers/durable_objects/namespaces/${nsId}/objects`
        )
        for (const obj of result) {
          instances.push({
            binding: ns.name,
            class_name: ns.class_name,
            id: obj.id,
            hasStoredData: obj.hasStoredData,
          })
        }
      } catch {
        // Skip namespaces that fail (permissions, etc.)
      }
    }

    return instances
  }

  async getInstance(_binding: string, _opts: { name?: string; id?: string }): Promise<{ id: string }> {
    throw new Error(
      'Creating Durable Object instances is not supported in remote mode. DO instances can only be created by your Worker code.'
    )
  }

  async fetch(_binding: string, _id: string, _path: string, _opts?: RequestInit): Promise<DOFetchResult> {
    throw new Error(
      'Invoking Durable Object methods is not supported in remote mode. DO methods can only be called by your Worker code.'
    )
  }
}
