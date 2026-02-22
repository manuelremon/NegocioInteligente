import { eq, and, desc, sql, gte, lte, like, asc } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

/* ------------------------------------------------------------------ */
/*  Suppliers                                                          */
/* ------------------------------------------------------------------ */

export async function listSuppliers(filters?: { search?: string; isActive?: boolean }) {
  const db = getDb()

  const conditions = []

  if (filters?.search) {
    conditions.push(like(schema.suppliers.name, `%${filters.search}%`))
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(schema.suppliers.isActive, filters.isActive))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const rows = db
    .select()
    .from(schema.suppliers)
    .where(whereClause)
    .orderBy(asc(schema.suppliers.name))
    .all()

  return rows
}

export async function createSupplier(data: {
  name: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
  notes?: string
}) {
  const db = getDb()

  const result = db
    .insert(schema.suppliers)
    .values({
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      taxId: data.taxId ?? null,
      notes: data.notes ?? null
    })
    .returning()
    .get()

  return result
}

export async function updateSupplier(data: {
  id: number
  name?: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
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
  if (fields.notes !== undefined) setValues.notes = fields.notes
  if (fields.isActive !== undefined) setValues.isActive = fields.isActive

  const result = db
    .update(schema.suppliers)
    .set(setValues)
    .where(eq(schema.suppliers.id, id))
    .returning()
    .get()

  return result
}

/* ------------------------------------------------------------------ */
/*  Purchases                                                          */
/* ------------------------------------------------------------------ */

export async function listPurchases(filters?: {
  from?: string
  to?: string
  supplierId?: number
  status?: string
  paymentStatus?: string
}) {
  const db = getDb()

  const conditions = []

  if (filters?.from) {
    conditions.push(gte(schema.purchases.createdAt, filters.from))
  }
  if (filters?.to) {
    conditions.push(lte(schema.purchases.createdAt, filters.to))
  }
  if (filters?.supplierId !== undefined) {
    conditions.push(eq(schema.purchases.supplierId, filters.supplierId))
  }
  if (filters?.status) {
    conditions.push(eq(schema.purchases.status, filters.status))
  }
  if (filters?.paymentStatus) {
    conditions.push(eq(schema.purchases.paymentStatus, filters.paymentStatus))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const rows = db
    .select({
      id: schema.purchases.id,
      supplierId: schema.purchases.supplierId,
      receiptNumber: schema.purchases.receiptNumber,
      subtotal: schema.purchases.subtotal,
      taxTotal: schema.purchases.taxTotal,
      total: schema.purchases.total,
      paymentMethod: schema.purchases.paymentMethod,
      paymentStatus: schema.purchases.paymentStatus,
      status: schema.purchases.status,
      notes: schema.purchases.notes,
      createdAt: schema.purchases.createdAt,
      supplierName: schema.suppliers.name
    })
    .from(schema.purchases)
    .leftJoin(schema.suppliers, eq(schema.purchases.supplierId, schema.suppliers.id))
    .where(whereClause)
    .orderBy(desc(schema.purchases.createdAt))
    .all()

  return rows
}

export async function getPurchaseById(id: number) {
  const db = getDb()

  const purchase = db
    .select({
      id: schema.purchases.id,
      supplierId: schema.purchases.supplierId,
      receiptNumber: schema.purchases.receiptNumber,
      subtotal: schema.purchases.subtotal,
      taxTotal: schema.purchases.taxTotal,
      total: schema.purchases.total,
      paymentMethod: schema.purchases.paymentMethod,
      paymentStatus: schema.purchases.paymentStatus,
      status: schema.purchases.status,
      notes: schema.purchases.notes,
      createdAt: schema.purchases.createdAt,
      supplierName: schema.suppliers.name
    })
    .from(schema.purchases)
    .leftJoin(schema.suppliers, eq(schema.purchases.supplierId, schema.suppliers.id))
    .where(eq(schema.purchases.id, id))
    .get()

  if (!purchase) return null

  const items = db
    .select()
    .from(schema.purchaseItems)
    .where(eq(schema.purchaseItems.purchaseId, id))
    .all()

  return { ...purchase, items }
}

export async function createPurchase(data: {
  supplierId: number
  receiptNumber?: string
  paymentMethod: 'cash' | 'card' | 'credit'
  items: Array<{
    productId: number
    productName: string
    quantity: number
    unitCost: number
    taxRate: number
  }>
  notes?: string
}) {
  const db = getDb()

  const receiptNumber =
    data.receiptNumber ||
    `C-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  // Calculate totals from items
  let subtotal = 0
  let taxTotal = 0

  const computedItems = data.items.map((item) => {
    const lineBase = item.quantity * item.unitCost
    const lineTax = lineBase * (item.taxRate / 100)
    const lineTotal = lineBase + lineTax

    subtotal += lineBase
    taxTotal += lineTax

    return { ...item, lineTotal }
  })

  const total = subtotal + taxTotal
  const paymentStatus = data.paymentMethod === 'credit' ? 'pending' : 'paid'

  const result = getSqlite().transaction(() => {
    // 1. Insert purchase
    const purchase = db
      .insert(schema.purchases)
      .values({
        supplierId: data.supplierId,
        receiptNumber,
        subtotal,
        taxTotal,
        total,
        paymentMethod: data.paymentMethod,
        paymentStatus,
        status: 'completed',
        notes: data.notes ?? null
      })
      .returning()
      .get()

    // 2. Insert purchase items
    const items = computedItems.map((item) => {
      return db
        .insert(schema.purchaseItems)
        .values({
          purchaseId: purchase.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal
        })
        .returning()
        .get()
    })

    // 3. Increment stock for each product
    for (const item of data.items) {
      db.update(schema.products)
        .set({
          stock: sql`stock + ${item.quantity}`,
          updatedAt: sql`(datetime('now','localtime'))`
        })
        .where(eq(schema.products.id, item.productId))
        .run()
    }

    // 4. If credit purchase, create ledger entry and update supplier balance
    if (data.paymentMethod === 'credit') {
      db.insert(schema.supplierLedger)
        .values({
          supplierId: data.supplierId,
          purchaseId: purchase.id,
          amount: total,
          type: 'charge',
          notes: `Compra a credito - ${receiptNumber}`
        })
        .run()

      db.update(schema.suppliers)
        .set({
          currentBalance: sql`current_balance + ${total}`
        })
        .where(eq(schema.suppliers.id, data.supplierId))
        .run()
    }

    return { ...purchase, items }
  })()

  return result
}

export async function updatePurchaseStatus(id: number, status: 'cancelled') {
  const db = getDb()

  // Get the purchase with items to revert stock
  const purchase = await getPurchaseById(id)
  if (!purchase) throw new Error('Compra no encontrada')
  if (purchase.status === 'cancelled') throw new Error('La compra ya esta cancelada')

  const result = getSqlite().transaction(() => {
    // 1. Update purchase status
    const updated = db
      .update(schema.purchases)
      .set({ status })
      .where(eq(schema.purchases.id, id))
      .returning()
      .get()

    // 2. Revert stock for each item
    for (const item of purchase.items) {
      db.update(schema.products)
        .set({
          stock: sql`stock - ${item.quantity}`,
          updatedAt: sql`(datetime('now','localtime'))`
        })
        .where(eq(schema.products.id, item.productId))
        .run()
    }

    // 3. If it was a credit purchase, revert supplier balance
    if (purchase.paymentMethod === 'credit') {
      db.insert(schema.supplierLedger)
        .values({
          supplierId: purchase.supplierId,
          purchaseId: id,
          amount: purchase.total,
          type: 'payment',
          notes: `Anulacion de compra - ${purchase.receiptNumber}`
        })
        .run()

      db.update(schema.suppliers)
        .set({
          currentBalance: sql`current_balance - ${purchase.total}`
        })
        .where(eq(schema.suppliers.id, purchase.supplierId))
        .run()
    }

    return updated
  })()

  return result
}

/* ------------------------------------------------------------------ */
/*  Supplier Payments                                                  */
/* ------------------------------------------------------------------ */

export async function registerSupplierPayment(data: {
  supplierId: number
  amount: number
  notes?: string
}) {
  const db = getDb()

  const result = getSqlite().transaction(() => {
    // 1. Create ledger entry
    const entry = db
      .insert(schema.supplierLedger)
      .values({
        supplierId: data.supplierId,
        amount: data.amount,
        type: 'payment',
        notes: data.notes ?? 'Pago a proveedor'
      })
      .returning()
      .get()

    // 2. Decrease supplier balance
    db.update(schema.suppliers)
      .set({
        currentBalance: sql`current_balance - ${data.amount}`
      })
      .where(eq(schema.suppliers.id, data.supplierId))
      .run()

    return entry
  })()

  return result
}

export async function getSupplierLedger(supplierId: number) {
  const db = getDb()

  const rows = db
    .select()
    .from(schema.supplierLedger)
    .where(eq(schema.supplierLedger.supplierId, supplierId))
    .orderBy(desc(schema.supplierLedger.createdAt))
    .all()

  return rows
}
