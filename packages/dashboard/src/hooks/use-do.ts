import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataSource, useMode } from '@/datasources'
import { queryKeys } from './keys'

export function useDONamespaces() {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.do.namespaces(mode),
    queryFn: () => ds.do.listNamespaces(),
  })
}

export function useDOInstances() {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.do.instances(mode),
    queryFn: () => ds.do.listInstances(),
  })
}

export function useDOCreateInstance() {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ binding, name }: { binding: string; name?: string }) => {
      const result = await ds.do.getInstance(binding, { name })
      return { binding, id: result.id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.do.instances(mode),
      })
    },
  })
}

export function useDOFetch() {
  const ds = useDataSource()

  return useMutation({
    mutationFn: async ({
      binding,
      id,
      path,
      method,
      body,
    }: {
      binding: string
      id: string
      path: string
      method: string
      body?: string
    }) => {
      return ds.do.fetch(binding, id, path, { method, body })
    },
  })
}
