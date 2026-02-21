import { eq, and, lte, gte, sql, asc, desc, type SQL } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

export async function salesSummary(filters: { from: string; to: string }) {
  const sqlite = getSqlite()

  const summary = sqlite
    .prepare(
      `SELECT
        COALESCE(SUM(total), 0) AS totalSales,
        COUNT(*) AS totalTransactions,
        CASE WHEN COUNT(*) > 0
          THEN ROUND(SUM(total) / COUNT(*), 2)
          ELSE 0
        END AS averageTicket
      FROM sales
      WHERE created_at >= ? AND created_at <= (? || ' 23:59:59')
        AND status = 'completed'`
    )
    .get(filters.from, filters.to) as {
      totalSales: number
      totalTransactions: number
      averageTicket: number
    }

  const dailyData = sqlite
    .prepare(
      `SELECT
        DATE(created_at) AS date,
        COALESCE(SUM(total), 0) AS total,
        COUNT(*) AS count
      FROM sales
      WHERE created_at >= ? AND created_at <= (? || ' 23:59:59')
        AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date ASC`
    )
    .all(filters.from, filters.to) as Array<{
      date: string
      total: number
      count: number
    }>

  return {
    totalSales: summary.totalSales,
    totalTransactions: summary.totalTransactions,
    averageTicket: summary.averageTicket,
    dailyData
  }
}

export async function topProducts(filters: { from: string; to: string }) {
  const sqlite = getSqlite()

  const rows = sqlite
    .prepare(
      `SELECT
        si.product_id AS productId,
        si.product_name AS productName,
        SUM(si.quantity) AS totalQuantity,
        SUM(si.line_total) AS totalRevenue
      FROM sale_items si
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= ? AND s.created_at <= (? || ' 23:59:59')
        AND s.status = 'completed'
      GROUP BY si.product_id, si.product_name
      ORDER BY totalQuantity DESC
      LIMIT 10`
    )
    .all(filters.from, filters.to) as Array<{
      productId: number
      productName: string
      totalQuantity: number
      totalRevenue: number
    }>

  return rows
}

export async function inventoryValue() {
  const sqlite = getSqlite()

  const result = sqlite
    .prepare(
      `SELECT
        COUNT(*) AS totalProducts,
        COALESCE(SUM(stock), 0) AS totalUnits,
        COALESCE(SUM(stock * cost_price), 0) AS totalCostValue,
        COALESCE(SUM(stock * base_price), 0) AS totalSaleValue
      FROM products
      WHERE is_active = 1`
    )
    .get() as {
      totalProducts: number
      totalUnits: number
      totalCostValue: number
      totalSaleValue: number
    }

  return result
}

export async function lowStock() {
  const db = getDb()

  const rows = db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      barcode: schema.products.barcode,
      sku: schema.products.sku,
      stock: schema.products.stock,
      minStock: schema.products.minStock,
      basePrice: schema.products.basePrice,
      costPrice: schema.products.costPrice,
      categoryId: schema.products.categoryId,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(
      and(
        lte(schema.products.stock, schema.products.minStock),
        eq(schema.products.trackInventory, true),
        eq(schema.products.isActive, true)
      )
    )
    .orderBy(asc(schema.products.name))
    .all()

  return rows
}

export async function debtors() {
  const sqlite = getSqlite()

  const rows = sqlite
    .prepare(
      `SELECT
        c.id AS customerId,
        c.name AS customerName,
        c.current_balance AS currentBalance,
        (
          SELECT MAX(s.created_at)
          FROM sales s
          WHERE s.customer_id = c.id
        ) AS lastPurchaseDate
      FROM customers c
      WHERE c.current_balance > 0
      ORDER BY c.current_balance DESC`
    )
    .all() as Array<{
      customerId: number
      customerName: string
      currentBalance: number
      lastPurchaseDate: string | null
    }>

  return rows
}

export async function cashHistory(filters?: { from?: string; to?: string }) {
  const db = getDb()

  const conditions: (SQL<unknown> | undefined)[] = []

  if (filters?.from) {
    conditions.push(gte(schema.registerSessions.openedAt, filters.from))
  }
  if (filters?.to) {
    conditions.push(lte(schema.registerSessions.openedAt, filters.to + ' 23:59:59'))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select()
    .from(schema.registerSessions)
    .where(whereClause)
    .orderBy(desc(schema.registerSessions.openedAt))
    .all()
}
