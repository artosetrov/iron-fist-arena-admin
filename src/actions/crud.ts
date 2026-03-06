'use server'

import { prisma } from '@/lib/prisma'

const SAFE_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

function sanitizeName(name: string): string {
  if (!SAFE_NAME_RE.test(name)) {
    throw new Error(`Invalid identifier: "${name}". Only alphanumeric characters and underscores are allowed.`)
  }
  return name
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
  return `'${String(value).replace(/'/g, "''")}'`
}

export async function createRecord(
  tableName: string,
  data: Record<string, unknown>
): Promise<{ success: true } | { error: string }> {
  try {
    const safeTable = sanitizeName(tableName)
    const entries = Object.entries(data)
    if (entries.length === 0) return { error: 'No data provided' }

    const columns = entries.map(([col]) => `"${sanitizeName(col)}"`).join(', ')
    const values = entries.map(([, val]) => formatValue(val)).join(', ')

    const sql = `INSERT INTO "${safeTable}" (${columns}) VALUES (${values})`
    await prisma.$executeRawUnsafe(sql)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateRecord(
  tableName: string,
  pkColumn: string,
  pkValue: string,
  data: Record<string, unknown>
): Promise<{ success: true } | { error: string }> {
  try {
    const safeTable = sanitizeName(tableName)
    const safePk = sanitizeName(pkColumn)
    const entries = Object.entries(data)
    if (entries.length === 0) return { error: 'No data provided' }

    const setClauses = entries
      .map(([col, val]) => `"${sanitizeName(col)}" = ${formatValue(val)}`)
      .join(', ')

    const sql = `UPDATE "${safeTable}" SET ${setClauses} WHERE "${safePk}" = ${formatValue(pkValue)}`
    await prisma.$executeRawUnsafe(sql)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteRecord(
  tableName: string,
  pkColumn: string,
  pkValue: string
): Promise<{ success: true } | { error: string }> {
  try {
    const safeTable = sanitizeName(tableName)
    const safePk = sanitizeName(pkColumn)

    const sql = `DELETE FROM "${safeTable}" WHERE "${safePk}" = ${formatValue(pkValue)}`
    await prisma.$executeRawUnsafe(sql)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
