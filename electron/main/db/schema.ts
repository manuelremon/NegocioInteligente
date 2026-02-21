import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => categories.id),
  name: text('name').notNull(),
  barcode: text('barcode'),
  sku: text('sku'),
  basePrice: real('base_price').notNull().default(0),
  costPrice: real('cost_price').notNull().default(0),
  taxRate: real('tax_rate').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  trackInventory: integer('track_inventory', { mode: 'boolean' }).notNull().default(true),
  stock: real('stock').notNull().default(0),
  minStock: real('min_stock').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

export const productVariants = sqliteTable('product_variants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  name: text('name').notNull(),
  sku: text('sku'),
  barcode: text('barcode'),
  priceModifier: real('price_modifier').notNull().default(0),
  stock: real('stock').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
})

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  taxId: text('tax_id'),
  creditLimit: real('credit_limit').notNull().default(0),
  currentBalance: real('current_balance').notNull().default(0),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

export const registerSessions = sqliteTable('register_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  openedAt: text('opened_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`),
  closedAt: text('closed_at'),
  openingFloat: real('opening_float').notNull().default(0),
  closingFloat: real('closing_float'),
  expectedFloat: real('expected_float'),
  cashSales: real('cash_sales').notNull().default(0),
  cardSales: real('card_sales').notNull().default(0),
  otherSales: real('other_sales').notNull().default(0),
  refunds: real('refunds').notNull().default(0),
  cashIn: real('cash_in').notNull().default(0),
  cashOut: real('cash_out').notNull().default(0),
  notes: text('notes'),
  status: text('status').notNull().default('open')
})

export const cashMovements = sqliteTable('cash_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .notNull()
    .references(() => registerSessions.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'in' | 'out'
  reason: text('reason').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .notNull()
    .references(() => registerSessions.id),
  customerId: integer('customer_id').references(() => customers.id),
  receiptNumber: text('receipt_number').notNull(),
  subtotal: real('subtotal').notNull().default(0),
  taxTotal: real('tax_total').notNull().default(0),
  discountTotal: real('discount_total').notNull().default(0),
  total: real('total').notNull().default(0),
  amountTendered: real('amount_tendered').notNull().default(0),
  change: real('change').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('cash'),
  status: text('status').notNull().default('completed'),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})

export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id')
    .notNull()
    .references(() => sales.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  variantId: integer('variant_id'),
  productName: text('product_name').notNull(),
  variantName: text('variant_name'),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  discountPercent: real('discount_percent').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  taxRate: real('tax_rate').notNull().default(0),
  lineTotal: real('line_total').notNull()
})

export const customerLedger = sqliteTable('customer_ledger', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),
  saleId: integer('sale_id').references(() => sales.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'charge' | 'payment'
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now','localtime'))`)
})
