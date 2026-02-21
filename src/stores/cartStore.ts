import { create } from 'zustand'
import type { CartItem } from '@renderer/types/ipc'

interface CartState {
  items: CartItem[]
  globalDiscount: number
  paymentMethod: 'cash' | 'card' | 'credit'
  customerId: number | null
  customerName: string | null

  addItem: (item: CartItem) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, quantity: number) => void
  applyDiscount: (percent: number) => void
  setPaymentMethod: (method: 'cash' | 'card' | 'credit') => void
  setCustomer: (id: number | null, name: string | null) => void
  clear: () => void
  getSubtotal: () => number
  getTaxTotal: () => number
  getDiscountTotal: () => number
  getTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  globalDiscount: 0,
  paymentMethod: 'cash',
  customerId: null,
  customerName: null,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )
        }
      }
      return { items: [...state.items, item] }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId)
    })),

  updateQty: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    })),

  applyDiscount: (percent) => set({ globalDiscount: percent }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),

  clear: () =>
    set({
      items: [],
      globalDiscount: 0,
      paymentMethod: 'cash',
      customerId: null,
      customerName: null
    }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const lineBase = item.unitPrice * item.quantity
      const discount = lineBase * (item.discountPercent / 100)
      return sum + (lineBase - discount)
    }, 0)
  },

  getTaxTotal: () => {
    return get().items.reduce((sum, item) => {
      const lineBase = item.unitPrice * item.quantity
      const discount = lineBase * (item.discountPercent / 100)
      const taxable = lineBase - discount
      return sum + taxable * (item.taxRate / 100)
    }, 0)
  },

  getDiscountTotal: () => {
    return get().items.reduce((sum, item) => {
      const lineBase = item.unitPrice * item.quantity
      return sum + lineBase * (item.discountPercent / 100)
    }, 0)
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTaxTotal()
  }
}))
