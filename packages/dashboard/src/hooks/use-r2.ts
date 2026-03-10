import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataSource, useMode } from '@/datasources'
import { queryKeys } from './keys'

export function useR2Buckets() {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.r2.buckets(mode),
    queryFn: () => ds.r2.listBuckets(),
  })
}

export function useR2Objects(binding: string | null, prefix?: string) {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.r2.objects(mode, binding ?? '', prefix),
    queryFn: () => (binding ? ds.r2.listObjects(binding, { prefix }) : null),
    enabled: !!binding,
  })
}

export function useR2ObjectMeta(binding: string | null, key: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.r2.objectMeta(mode, binding ?? '', key ?? ''),
    queryFn: () => (binding && key ? ds.r2.getObjectMeta(binding, key) : null),
    enabled: !!binding && !!key,
  })
}

export function useR2Upload(binding: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, file }: { key: string; file: File }) => {
      if (!binding) throw new Error('No bucket selected')
      return ds.r2.uploadObject(binding, key, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.r2.objects(mode, binding ?? ''),
      })
    },
  })
}

export function useR2Delete(binding: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (key: string) => {
      if (!binding) throw new Error('No bucket selected')
      await ds.r2.deleteObject(binding, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.r2.objects(mode, binding ?? ''),
      })
    },
  })
}

/** Returns null in remote mode. */
export function useR2ObjectUrl(binding: string | null, key: string | null): string | null {
  const ds = useDataSource()
  if (!binding || !key) return null
  return ds.r2.getObjectUrl(binding, key)
}
