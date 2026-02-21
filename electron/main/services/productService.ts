import { eq, like, and, or, sql, asc } from 'drizzle-orm'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'

export async function listProducts(filters?: {
  categoryId?: number
  search?: string
  isActive?: boolean
}) {
  const db = getDb()

  const conditions = []

  if (filters?.categoryId !== undefined) {
    conditions.push(eq(schema.products.categoryId, filters.categoryId))
  }
  if (filters?.search) {
    conditions.push(like(schema.products.name, `%${filters.search}%`))
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(schema.products.isActive, filters.isActive))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const rows = db
    .select({
      id: schema.products.id,
      categoryId: schema.products.categoryId,
      name: schema.products.name,
      barcode: schema.products.barcode,
      sku: schema.products.sku,
      basePrice: schema.products.basePrice,
      costPrice: schema.products.costPrice,
      taxRate: schema.products.taxRate,
      isActive: schema.products.isActive,
      trackInventory: schema.products.trackInventory,
      stock: schema.products.stock,
      minStock: schema.products.minStock,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(whereClause)
    .orderBy(asc(schema.products.name))
    .all()

  return rows
}

export async function getProductById(id: number) {
  const db = getDb()

  const row = db
    .select({
      id: schema.products.id,
      categoryId: schema.products.categoryId,
      name: schema.products.name,
      barcode: schema.products.barcode,
      sku: schema.products.sku,
      basePrice: schema.products.basePrice,
      costPrice: schema.products.costPrice,
      taxRate: schema.products.taxRate,
      isActive: schema.products.isActive,
      trackInventory: schema.products.trackInventory,
      stock: schema.products.stock,
      minStock: schema.products.minStock,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(eq(schema.products.id, id))
    .get()

  return row ?? null
}

export async function createProduct(data: {
  name: string
  categoryId?: number
  barcode?: string
  sku?: string
  basePrice?: number
  costPrice?: number
  taxRate?: number
  trackInventory?: boolean
  stock?: number
  minStock?: number
}) {
  const db = getDb()

  const result = db
    .insert(schema.products)
    .values({
      name: data.name,
      categoryId: data.categoryId ?? null,
      barcode: data.barcode ?? null,
      sku: data.sku ?? null,
      basePrice: data.basePrice ?? 0,
      costPrice: data.costPrice ?? 0,
      taxRate: data.taxRate ?? 0,
      trackInventory: data.trackInventory ?? true,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 0
    })
    .returning()
    .get()

  return result
}

export async function updateProduct(data: {
  id: number
  name?: string
  categoryId?: number
  barcode?: string
  sku?: string
  basePrice?: number
  costPrice?: number
  taxRate?: number
  isActive?: boolean
  trackInventory?: boolean
  stock?: number
  minStock?: number
}) {
  const db = getDb()

  const { id, ...fields } = data

  const setValues: Record<string, unknown> = {
    updatedAt: sql`(datetime('now','localtime'))`
  }

  if (fields.name !== undefined) setValues.name = fields.name
  if (fields.categoryId !== undefined) setValues.categoryId = fields.categoryId
  if (fields.barcode !== undefined) setValues.barcode = fields.barcode
  if (fields.sku !== undefined) setValues.sku = fields.sku
  if (fields.basePrice !== undefined) setValues.basePrice = fields.basePrice
  if (fields.costPrice !== undefined) setValues.costPrice = fields.costPrice
  if (fields.taxRate !== undefined) setValues.taxRate = fields.taxRate
  if (fields.isActive !== undefined) setValues.isActive = fields.isActive
  if (fields.trackInventory !== undefined) setValues.trackInventory = fields.trackInventory
  if (fields.stock !== undefined) setValues.stock = fields.stock
  if (fields.minStock !== undefined) setValues.minStock = fields.minStock

  const result = db
    .update(schema.products)
    .set(setValues)
    .where(eq(schema.products.id, id))
    .returning()
    .get()

  return result
}

export async function adjustStock(data: { id: number; adjustment: number }) {
  const db = getDb()

  const result = db
    .update(schema.products)
    .set({
      stock: sql`stock + ${data.adjustment}`,
      updatedAt: sql`(datetime('now','localtime'))`
    })
    .where(eq(schema.products.id, data.id))
    .returning()
    .get()

  return result
}

export async function searchProducts(query: string) {
  const db = getDb()

  const pattern = `%${query}%`

  const rows = db
    .select({
      id: schema.products.id,
      categoryId: schema.products.categoryId,
      name: schema.products.name,
      barcode: schema.products.barcode,
      sku: schema.products.sku,
      basePrice: schema.products.basePrice,
      costPrice: schema.products.costPrice,
      taxRate: schema.products.taxRate,
      isActive: schema.products.isActive,
      trackInventory: schema.products.trackInventory,
      stock: schema.products.stock,
      minStock: schema.products.minStock,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt,
      categoryName: schema.categories.name
    })
    .from(schema.products)
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(
      and(
        eq(schema.products.isActive, true),
        or(
          like(schema.products.name, pattern),
          like(schema.products.barcode, pattern),
          like(schema.products.sku, pattern)
        )
      )
    )
    .limit(50)
    .all()

  return rows
}
