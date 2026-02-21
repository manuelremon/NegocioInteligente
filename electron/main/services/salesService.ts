import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

export async function completeSale(data: {
  sessionId: number
  customerId?: number
  paymentMethod: 'cash' | 'card' | 'credit'
  amountTendered: number
  items: Array<{
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    discountPercent: number
    taxRate: number
  }>
  notes?: string
}) {
  const db = getDb()

  const receiptNumber = `R-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  // Calculate totals from items
  let subtotal = 0
  let taxTotal = 0
  let discountTotal = 0

  const computedItems = data.items.map((item) => {
    const lineGross = item.quantity * item.unitPrice
    const lineDiscount = lineGross * (item.discountPercent / 100)
    const lineAfterDiscount = lineGross - lineDiscount
    const lineTax = lineAfterDiscount * (item.taxRate / 100)
    const lineTotal = lineAfterDiscount + lineTax

    subtotal += lineAfterDiscount
    taxTotal += lineTax
    discountTotal += lineDiscount

    return {
      ...item,
      discountAmount: lineDiscount,
      lineTotal
    }
  })

  const total = subtotal + taxTotal
  const change = data.paymentMethod === 'cash' ? Math.max(0, data.amountTendered - total) : 0

  // Atomic transaction using better-sqlite3 directly
  const result = getSqlite().transaction(() => {
    // 1. Insert sale
    const sale = db
      .insert(schema.sales)
      .values({
        sessionId: data.sessionId,
        customerId: data.customerId ?? null,
        receiptNumber,
        subtotal,
        taxTotal,
        discountTotal,
        total,
        amountTendered: data.amountTendered,
        change,
        paymentMethod: data.paymentMethod,
        status: 'completed',
        notes: data.notes ?? null
      })
      .returning()
      .get()

    // 2. Insert sale items
    const items = computedItems.map((item) => {
      return db
        .insert(schema.saleItems)
        .values({
          saleId: sale.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal
        })
        .returning()
        .get()
    })

    // 3. Decrement stock for each product
    for (const item of data.items) {
      db.update(schema.products)
        .set({
          stock: sql`stock - ${item.quantity}`,
          updatedAt: sql`(datetime('now','localtime'))`
        })
        .where(eq(schema.products.id, item.productId))
        .run()
    }

    // 4. Update register session totals based on payment method
    if (data.paymentMethod === 'cash') {
      db.update(schema.registerSessions)
        .set({
          cashSales: sql`cash_sales + ${total}`
        })
        .where(eq(schema.registerSessions.id, data.sessionId))
        .run()
    } else if (data.paymentMethod === 'card') {
      db.update(schema.registerSessions)
        .set({
          cardSales: sql`card_sales + ${total}`
        })
        .where(eq(schema.registerSessions.id, data.sessionId))
        .run()
    } else if (data.paymentMethod === 'credit') {
      db.update(schema.registerSessions)
        .set({
          otherSales: sql`other_sales + ${total}`
        })
        .where(eq(schema.registerSessions.id, data.sessionId))
        .run()
    }

    // 5. If credit sale, create ledger entry and update customer balance
    if (data.paymentMethod === 'credit' && data.customerId) {
      db.insert(schema.customerLedger)
        .values({
          customerId: data.customerId,
          saleId: sale.id,
          amount: total,
          type: 'charge',
          notes: `Venta a credito - ${receiptNumber}`
        })
        .run()

      db.update(schema.customers)
        .set({
          currentBalance: sql`current_balance + ${total}`
        })
        .where(eq(schema.customers.id, data.customerId))
        .run()
    }

    return { ...sale, items }
  })()

  return result
}

export async function listSales(filters?: {
  from?: string
  to?: string
  paymentMethod?: string
  customerId?: number
}) {
  const db = getDb()

  const conditions = []

  if (filters?.from) {
    conditions.push(gte(schema.sales.createdAt, filters.from))
  }
  if (filters?.to) {
    conditions.push(lte(schema.sales.createdAt, filters.to))
  }
  if (filters?.paymentMethod) {
    conditions.push(eq(schema.sales.paymentMethod, filters.paymentMethod))
  }
  if (filters?.customerId !== undefined) {
    conditions.push(eq(schema.sales.customerId, filters.customerId))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const rows = db
    .select({
      id: schema.sales.id,
      sessionId: schema.sales.sessionId,
      customerId: schema.sales.customerId,
      receiptNumber: schema.sales.receiptNumber,
      subtotal: schema.sales.subtotal,
      taxTotal: schema.sales.taxTotal,
      discountTotal: schema.sales.discountTotal,
      total: schema.sales.total,
      amountTendered: schema.sales.amountTendered,
      change: schema.sales.change,
      paymentMethod: schema.sales.paymentMethod,
      status: schema.sales.status,
      notes: schema.sales.notes,
      createdAt: schema.sales.createdAt,
      customerName: schema.customers.name
    })
    .from(schema.sales)
    .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
    .where(whereClause)
    .orderBy(desc(schema.sales.createdAt))
    .all()

  return rows
}

export async function getSaleById(id: number) {
  const db = getDb()

  const sale = db
    .select({
      id: schema.sales.id,
      sessionId: schema.sales.sessionId,
      customerId: schema.sales.customerId,
      receiptNumber: schema.sales.receiptNumber,
      subtotal: schema.sales.subtotal,
      taxTotal: schema.sales.taxTotal,
      discountTotal: schema.sales.discountTotal,
      total: schema.sales.total,
      amountTendered: schema.sales.amountTendered,
      change: schema.sales.change,
      paymentMethod: schema.sales.paymentMethod,
      status: schema.sales.status,
      notes: schema.sales.notes,
      createdAt: schema.sales.createdAt,
      customerName: schema.customers.name
    })
    .from(schema.sales)
    .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
    .where(eq(schema.sales.id, id))
    .get()

  if (!sale) return null

  const items = db
    .select()
    .from(schema.saleItems)
    .where(eq(schema.saleItems.saleId, id))
    .all()

  return { ...sale, items }
}
