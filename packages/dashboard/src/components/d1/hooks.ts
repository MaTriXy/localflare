/** @deprecated Import from '@/hooks' instead. */
export {
  useD1Databases,
  useD1Schema,
  useD1AllTableSchemas,
  useD1TableInfo,
  useD1TableRows,
  useD1Query,
  useD1InsertRow,
  useD1UpdateRow,
  useD1DeleteRow,
  usePagination,
  useRowSelection,
  useQueryHistory,
  useGetRowId,
  useColumnEditability,
  type SortConfig,
} from '@/hooks/use-d1'

import { queryKeys } from '@/hooks/keys'
export const d1QueryKeys = queryKeys.d1
