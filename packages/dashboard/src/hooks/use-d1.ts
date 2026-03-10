import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDataSource, useMode } from '@/datasources'
import type { D1ColumnInfo, D1TableDetail } from '@/datasources'
import { queryKeys } from './keys'
import type {
  D1TableSchema,
  D1Row,
  D1CellValue,
  QueryHistoryEntry,
  PaginationState,
  RowSelectionState,
} from '@/components/d1/types'

export interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

export function useD1Databases() {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.d1.databases(mode),
    queryFn: () => ds.d1.listDatabases(),
  })
}

export function useD1Schema(binding: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.d1.schema(mode, binding ?? ''),
    queryFn: () => (binding ? ds.d1.getSchema(binding) : null),
    enabled: !!binding,
  })
}

export function useD1AllTableSchemas(binding: string | null, tableNames: string[] | undefined) {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.d1.allSchemas(mode, binding ?? '', tableNames?.join(',') ?? ''),
    queryFn: async (): Promise<D1TableSchema[]> => {
      if (!binding || !tableNames?.length) return []

      const tableInfos = await Promise.all(
        tableNames.map(async (tableName) => {
          try {
            const info = await ds.d1.getTableInfo(binding, tableName)
            return detailToSchema(info)
          } catch {
            return {
              name: tableName,
              columns: [],
              primaryKeys: [],
              foreignKeys: [],
              indexes: [],
              rowCount: 0,
            }
          }
        })
      )
      return tableInfos
    },
    enabled: !!binding && !!tableNames?.length,
    staleTime: 5 * 60 * 1000,
  })
}

export function useD1TableInfo(binding: string | null, table: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()

  return useQuery({
    queryKey: queryKeys.d1.tableInfo(mode, binding ?? '', table ?? ''),
    queryFn: async (): Promise<D1TableSchema | null> => {
      if (!binding || !table) return null
      const info = await ds.d1.getTableInfo(binding, table)
      return detailToSchema(info)
    },
    enabled: !!binding && !!table,
  })
}

export function useD1TableRows(
  binding: string | null,
  table: string | null,
  pagination: PaginationState,
  sort?: SortConfig | null
) {
  const ds = useDataSource()
  const { mode } = useMode()
  const offset = pagination.pageIndex * pagination.pageSize

  return useQuery({
    queryKey: queryKeys.d1.tableRows(
      mode,
      binding ?? '',
      table ?? '',
      pagination.pageIndex,
      pagination.pageSize,
      sort?.column,
      sort?.direction
    ),
    queryFn: () =>
      binding && table
        ? ds.d1.getRows(binding, table, {
            limit: pagination.pageSize,
            offset,
            sort: sort?.column,
            direction: sort?.direction,
          })
        : null,
    enabled: !!binding && !!table,
  })
}

export function useD1Query(binding: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sql, params = [] }: { sql: string; params?: unknown[] }) => {
      if (!binding) throw new Error('No database selected')
      return ds.d1.execute(binding, sql, params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.d1.all(mode), 'rows', binding],
      })
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.d1.all(mode), 'table-info', binding],
      })
    },
  })
}

export function useD1InsertRow(binding: string | null, table: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, D1CellValue>) => {
      if (!binding || !table) throw new Error('No table selected')
      return ds.d1.insertRow(binding, table, data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.d1.tableInfo(mode, binding ?? '', table ?? ''),
      })
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey
          return key[0] === 'd1' && key[1] === mode && key[2] === 'rows' && key[3] === binding && key[4] === table
        },
      })
    },
  })
}

export function useD1UpdateRow(binding: string | null, table: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ rowId, data }: { rowId: string | number; data: Record<string, D1CellValue> }) => {
      if (!binding || !table) throw new Error('No table selected')
      return ds.d1.updateRow(binding, table, String(rowId), data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey
          return key[0] === 'd1' && key[1] === mode && key[2] === 'rows' && key[3] === binding && key[4] === table
        },
      })
    },
  })
}

export function useD1DeleteRow(binding: string | null, table: string | null) {
  const ds = useDataSource()
  const { mode } = useMode()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rowId: string | number) => {
      if (!binding || !table) throw new Error('No table selected')
      return ds.d1.deleteRow(binding, table, String(rowId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.d1.tableInfo(mode, binding ?? '', table ?? ''),
      })
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey
          return key[0] === 'd1' && key[1] === mode && key[2] === 'rows' && key[3] === binding && key[4] === table
        },
      })
    },
  })
}

export function usePagination(initialPageSize = 50) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
    totalRows: 0,
    totalPages: 0,
  })

  const updatePagination = useCallback((updates: Partial<PaginationState>) => {
    setPagination((prev) => {
      const next = { ...prev, ...updates }
      if (updates.totalRows !== undefined || updates.pageSize !== undefined) {
        next.totalPages = Math.ceil(next.totalRows / next.pageSize)
      }
      return next
    })
  }, [])

  const goToPage = useCallback((pageIndex: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.max(0, Math.min(pageIndex, prev.totalPages - 1)),
    }))
  }, [])

  const nextPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.min(prev.pageIndex + 1, prev.totalPages - 1),
    }))
  }, [])

  const prevPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.max(prev.pageIndex - 1, 0),
    }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize,
      pageIndex: 0,
      totalPages: Math.ceil(prev.totalRows / pageSize),
    }))
  }, [])

  return { pagination, updatePagination, goToPage, nextPage, prevPage, setPageSize }
}

export function useRowSelection() {
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({})

  const toggleRow = useCallback((rowId: string) => {
    setSelectedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
  }, [])

  const selectAll = useCallback((rowIds: string[]) => {
    setSelectedRows(rowIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedRows({})
  }, [])

  const selectedRowIds = useMemo(
    () =>
      Object.entries(selectedRows)
        .filter(([_, selected]) => selected)
        .map(([id]) => id),
    [selectedRows]
  )

  const selectedCount = selectedRowIds.length

  return { selectedRows, selectedRowIds, selectedCount, toggleRow, selectAll, clearSelection, setSelectedRows }
}

export function useQueryHistory(maxEntries = 50) {
  const STORAGE_KEY = 'localflare-d1-query-history'

  const [entries, setEntries] = useState<QueryHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const addEntry = useCallback(
    (entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>) => {
      const newEntry: QueryHistoryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      }

      setEntries((prev) => {
        const next = [newEntry, ...prev].slice(0, maxEntries)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // Ignore storage errors
        }
        return next
      })
    },
    [maxEntries]
  )

  const clearHistory = useCallback(() => {
    setEntries([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }, [])

  return { entries, addEntry, clearHistory, removeEntry }
}

export function useGetRowId(schema: D1TableSchema | null) {
  return useCallback(
    (row: D1Row): string => {
      if (!schema || schema.primaryKeys.length === 0) {
        return JSON.stringify(row)
      }
      if (schema.primaryKeys.length === 1) {
        return String(row[schema.primaryKeys[0]])
      }
      const keyValues = schema.primaryKeys.map((pk) => row[pk])
      return JSON.stringify(keyValues)
    },
    [schema]
  )
}

export function useColumnEditability(schema: D1TableSchema | null) {
  return useCallback(
    (columnName: string): boolean => {
      if (!schema) return false
      const column = schema.columns.find((c) => c.name === columnName)
      if (!column) return false
      if (column.pk === 1 && column.type.toUpperCase() === 'INTEGER') {
        return false
      }
      return true
    },
    [schema]
  )
}

function detailToSchema(info: D1TableDetail): D1TableSchema {
  const columns = info.columns as D1ColumnInfo[]
  const primaryKeys = columns
    .filter((col) => col.pk > 0)
    .sort((a, b) => a.pk - b.pk)
    .map((col) => col.name)

  return {
    name: info.table,
    columns,
    primaryKeys,
    foreignKeys: (info.foreignKeys || []) as D1TableSchema['foreignKeys'],
    indexes: (info.indexes || []) as D1TableSchema['indexes'],
    rowCount: info.rowCount,
  }
}
