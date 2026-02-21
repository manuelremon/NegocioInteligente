import { eq, and, or, like, asc, desc, sql, type SQL } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

export async function listCustomers(filters?: {
  search?: string
  isActive?: boolean
}) {
  const db = getDb()

  const conditions: (SQL<unknown> | undefined)[] = []

  if (filters?.search) {
    const pattern = `%${filters.search}%`
    conditions.push(
      or(
        like(schema.customers.name, pattern),
        like(schema.customers.phone, pattern)
      )
    )
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(schema.customers.isActive, filters.isActive))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select()
    .from(schema.customers)
    .where(whereClause)
    .orderBy(asc(schema.customers.name))
    .all()
}

export async function getCustomerById(id: number) {
  const db = getDb()

  const row = db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id))
    .get()

  return row ?? null
}

export async function createCustomer(data: {
  name: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
  creditLimit?: number
  notes?: string
}) {
  const db = getDb()

  const result = db
    .insert(schema.customers)
    .values({
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      taxId: data.taxId ?? null,
      creditLimit: data.creditLimit ?? 0,
      notes: data.notes ?? null
    })
    .returning()
    .get()

  return result
}

export async function updateCustomer(data: {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
  creditLimit?: number
  notes?: string
  isActive?: boolean
}) {
  const db = getDb()

  const { id, ...fields } = data

  const setValues: Record<string, unknown> = {}

  if (fields.name !== undefined) setValues.name = fields.name
  if (fields.phone !== undefined) setValues.phone = fields.phone
  if (fields.email !== undefined) setValues.email = fields.email
  if (fields.address !== undefined) setValues.address = fields.address
  if (fields.taxId !== undefined) setValues.taxId = fields.taxId
  if (fields.creditLimit !== undefined) setValues.creditLimit = fields.creditLimit
  if (fields.notes !== undefined) setValues.notes = fields.notes
  if (fields.isActive !== undefined) setValues.isActive = fields.isActive

  const result = db
    .update(schema.customers)
    .set(setValues)
    .where(eq(schema.customers.id, id))
    .returning()
    .get()

  return result
}

export async function registerPayment(data: {
  customerId: number
  amount: number
  notes?: string
}) {
  const sqlite = getSqlite()
  const db = getDb()

  const transaction = sqlite.transaction(() => {
    const ledgerEntry = db
      .insert(schema.customerLedger)
      .values({
        customerId: data.customerId,
        amount: data.amount,
        type: 'payment',
        notes: data.notes ?? null
      })
      .returning()
      .get()

    db.update(schema.customers)
      .set({
        currentBalance: sql`current_balance - ${data.amount}`
      })
      .where(eq(schema.customers.id, data.customerId))
      .run()

    return ledgerEntry
  })

  return transaction()
}

export async function getLedger(customerId: number) {
  const db = getDb()

  const rows = db
    .select({
      id: schema.customerLedger.id,
      customerId: schema.customerLedger.customerId,
      saleId: schema.customerLedger.saleId,
      amount: schema.customerLedger.amount,
      type: schema.customerLedger.type,
      notes: schema.customerLedger.notes,
      createdAt: schema.customerLedger.createdAt,
      receiptNumber: schema.sales.receiptNumber
    })
    .from(schema.customerLedger)
    .leftJoin(schema.sales, eq(schema.customerLedger.saleId, schema.sales.id))
    .where(eq(schema.customerLedger.customerId, customerId))
    .orderBy(desc(schema.customerLedger.createdAt))
    .all()

  return rows
}
