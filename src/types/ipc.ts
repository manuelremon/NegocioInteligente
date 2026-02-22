export interface IpcResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

export interface Category {
  id: number
  name: string
  color: string | null
  icon: string | null
  createdAt: string
}

export interface Product {
  id: number
  categoryId: number | null
  categoryName?: string
  name: string
  barcode: string | null
  sku: string | null
  basePrice: number
  costPrice: number
  taxRate: number
  isActive: boolean
  trackInventory: boolean
  stock: number
  minStock: number
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  taxId: string | null
  creditLimit: number
  currentBalance: number
  notes: string | null
  isActive: boolean
  createdAt: string
}

export interface RegisterSession {
  id: number
  openedAt: string
  closedAt: string | null
  openingFloat: number
  closingFloat: number | null
  expectedFloat: number | null
  cashSales: number
  cardSales: number
  otherSales: number
  refunds: number
  cashIn: number
  cashOut: number
  notes: string | null
  status: 'open' | 'closed'
}

export interface CashMovement {
  id: number
  sessionId: number
  amount: number
  type: 'in' | 'out'
  reason: string
  createdAt: string
}

export interface Sale {
  id: number
  sessionId: number
  customerId: number | null
  customerName?: string
  receiptNumber: string
  subtotal: number
  taxTotal: number
  discountTotal: number
  total: number
  amountTendered: number
  change: number
  paymentMethod: 'cash' | 'card' | 'credit'
  status: 'completed' | 'refunded'
  notes: string | null
  createdAt: string
  items?: SaleItem[]
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  variantId: number | null
  productName: string
  variantName: string | null
  quantity: number
  unitPrice: number
  discountPercent: number
  discountAmount: number
  taxRate: number
  lineTotal: number
}

export interface CustomerLedgerEntry {
  id: number
  customerId: number
  saleId: number | null
  amount: number
  type: 'charge' | 'payment'
  notes: string | null
  createdAt: string
}

export interface CartItem {
  productId: number
  variantId: number | null
  productName: string
  variantName: string | null
  quantity: number
  unitPrice: number
  discountPercent: number
  taxRate: number
  stock: number
}

export interface SalesFilters {
  from?: string
  to?: string
  paymentMethod?: string
  customerId?: number
}

export interface ProductFilters {
  categoryId?: number
  search?: string
  isActive?: boolean
}

export interface ReportFilters {
  from: string
  to: string
}

export interface SalesSummary {
  totalSales: number
  totalTransactions: number
  averageTicket: number
  dailyData: { date: string; total: number; count: number }[]
}

export interface TopProduct {
  productId: number
  productName: string
  totalQuantity: number
  totalRevenue: number
}

export interface InventoryValue {
  totalProducts: number
  totalUnits: number
  totalCostValue: number
  totalSaleValue: number
}

export interface Debtor {
  customerId: number
  customerName: string
  currentBalance: number
  lastPurchaseDate: string | null
}

/* ------------------------------------------------------------------ */
/*  Purchases module                                                   */
/* ------------------------------------------------------------------ */

export interface Supplier {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  taxId: string | null
  notes: string | null
  currentBalance: number
  isActive: boolean
  createdAt: string
}

export interface Purchase {
  id: number
  supplierId: number
  supplierName?: string
  receiptNumber: string
  subtotal: number
  taxTotal: number
  total: number
  paymentMethod: 'cash' | 'card' | 'credit'
  paymentStatus: 'paid' | 'partial' | 'pending'
  status: 'draft' | 'completed' | 'cancelled'
  notes: string | null
  createdAt: string
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: number
  purchaseId: number
  productId: number
  productName: string
  quantity: number
  unitCost: number
  taxRate: number
  lineTotal: number
}

export interface PurchaseFilters {
  from?: string
  to?: string
  supplierId?: number
  status?: string
  paymentStatus?: string
}

export interface SupplierLedgerEntry {
  id: number
  supplierId: number
  purchaseId: number | null
  amount: number
  type: 'charge' | 'payment'
  notes: string | null
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Settings / License / Modules                                       */
/* ------------------------------------------------------------------ */

export type LicenseTier = 'basico' | 'pro' | 'enterprise'

export interface ActiveModulesInfo {
  tier: LicenseTier
  enabledIds: string[]
}

export interface ModuleNavItem {
  id: string
  label: string
  icon: string
  path: string
  shortcut?: string
  keyCode?: string
}

export interface RendererModuleDefinition {
  id: string
  name: string
  description: string
  version: string
  tier: LicenseTier
  isCore: boolean
  navItems: ModuleNavItem[]
  pageComponentId: string
}
