import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataSource, useMode } from '@/datasources'
import { queryKeys } from './keys'

export function useKVNamespaces() {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.kv.namespaces(mode),
    queryFn: () => ds.kv.listNamespaces(),
  })
}

export function useKVKeys(binding: string | null, prefix?: string) {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.kv.keys(mode, binding ?? '', prefix),
    queryFn: () => (binding ? ds.kv.listKeys(binding, { prefix: prefix || undefined }) : null),
    enabled: !!binding,
  })
}

export function useKVValue(binding: string | null, key: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.kv.value(mode, binding ?? '', key ?? ''),
    queryFn: () => (binding && key ? ds.kv.getValue(binding, key) : null),
    enabled: !!binding && !!key,
  })
}

export function useKVSetValue(binding: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value, metadata, ttl }: { key: string; value: string; metadata?: unknown; ttl?: number }) => {
      if (!binding) throw new Error('No namespace selected')
      await ds.kv.setValue(binding, key, value, metadata, ttl)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kv.keys(mode, binding ?? ''),
      })
    },
  })
}

export function useKVDeleteKey(binding: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (key: string) => {
      if (!binding) throw new Error('No namespace selected')
      await ds.kv.deleteKey(binding, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kv.keys(mode, binding ?? ''),
      })
    },
  })
}
