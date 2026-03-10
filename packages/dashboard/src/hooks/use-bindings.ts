import { useQuery } from '@tanstack/react-query'
import { useDataSource, useMode } from '@/datasources'
import { queryKeys } from './keys'

export function useBindings() {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.bindings.all(mode),
    queryFn: () => ds.bindings.getAll(),
    refetchInterval: mode === 'local' ? 5000 : 30000,
    retry: 1,
  })
}
