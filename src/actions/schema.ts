'use server'

import { getTables, getTableInfo, getTableRows } from '@/lib/schema-introspection'
import type { TableInfo } from '@/types/schema'

export async function getTablesList(): Promise<string[]> {
  return getTables()
}

export async function getTableDetails(tableName: string): Promise<TableInfo> {
  return getTableInfo(tableName)
}

export async function getTableData(
  tableName: string,
  options: {
    page?: number
    pageSize?: number
    search?: string
    searchColumn?: string
    orderBy?: string
    orderDir?: 'asc' | 'desc'
  } = {}
): Promise<{
  rows: Record<string, unknown>[]
  totalRows: number
  page: number
  pageSize: number
}> {
  return getTableRows(tableName, options)
}
