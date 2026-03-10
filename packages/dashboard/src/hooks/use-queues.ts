import { useQuery, useMutation } from '@tanstack/react-query'
import { useDataSource, useMode } from '@/datasources'
import { queryKeys } from './keys'

export function useQueues() {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.queues.list(mode),
    queryFn: () => ds.queues.listQueues(),
  })
}

export function useQueueSend() {
  const ds = useDataSource()

  return useMutation({
    mutationFn: async ({ binding, message }: { binding: string; message: unknown }) => {
      await ds.queues.sendMessage(binding, message)
    },
  })
}
