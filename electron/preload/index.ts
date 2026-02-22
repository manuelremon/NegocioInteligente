import { contextBridge, ipcRenderer } from 'electron'

const api = {
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (data: unknown) => ipcRenderer.invoke('categories:create', data),
    update: (data: unknown) => ipcRenderer.invoke('categories:update', data),
    remove: (id: number) => ipcRenderer.invoke('categories:remove', id)
  },
  products: {
    list: (filters?: unknown) => ipcRenderer.invoke('products:list', filters),
    getById: (id: number) => ipcRenderer.invoke('products:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('products:create', data),
    update: (data: unknown) => ipcRenderer.invoke('products:update', data),
    adjustStock: (data: unknown) => ipcRenderer.invoke('products:adjustStock', data),
    search: (query: string) => ipcRenderer.invoke('products:search', query)
  },
  sales: {
    complete: (data: unknown) => ipcRenderer.invoke('sales:complete', data),
    list: (filters?: unknown) => ipcRenderer.invoke('sales:list', filters),
    getById: (id: number) => ipcRenderer.invoke('sales:getById', id)
  },
  cash: {
    openSession: (data: unknown) => ipcRenderer.invoke('cash:openSession', data),
    closeSession: (data: unknown) => ipcRenderer.invoke('cash:closeSession', data),
    getActiveSession: () => ipcRenderer.invoke('cash:getActiveSession'),
    addMovement: (data: unknown) => ipcRenderer.invoke('cash:addMovement', data),
    getSessionHistory: () => ipcRenderer.invoke('cash:getSessionHistory'),
    getSessionDetail: (id: number) => ipcRenderer.invoke('cash:getSessionDetail', id)
  },
  customers: {
    list: (filters?: unknown) => ipcRenderer.invoke('customers:list', filters),
    getById: (id: number) => ipcRenderer.invoke('customers:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('customers:create', data),
    update: (data: unknown) => ipcRenderer.invoke('customers:update', data),
    registerPayment: (data: unknown) => ipcRenderer.invoke('customers:registerPayment', data),
    getLedger: (customerId: number) => ipcRenderer.invoke('customers:getLedger', customerId)
  },
  reports: {
    salesSummary: (filters: unknown) => ipcRenderer.invoke('reports:salesSummary', filters),
    topProducts: (filters: unknown) => ipcRenderer.invoke('reports:topProducts', filters),
    inventoryValue: () => ipcRenderer.invoke('reports:inventoryValue'),
    lowStock: () => ipcRenderer.invoke('reports:lowStock'),
    debtors: () => ipcRenderer.invoke('reports:debtors'),
    cashHistory: (filters?: unknown) => ipcRenderer.invoke('reports:cashHistory', filters)
  },
  purchases: {
    listSuppliers: (filters?: unknown) => ipcRenderer.invoke('purchases:listSuppliers', filters),
    createSupplier: (data: unknown) => ipcRenderer.invoke('purchases:createSupplier', data),
    updateSupplier: (data: unknown) => ipcRenderer.invoke('purchases:updateSupplier', data),
    list: (filters?: unknown) => ipcRenderer.invoke('purchases:list', filters),
    getById: (id: number) => ipcRenderer.invoke('purchases:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('purchases:create', data),
    updateStatus: (id: number, status: string) =>
      ipcRenderer.invoke('purchases:updateStatus', id, status),
    registerPayment: (data: unknown) => ipcRenderer.invoke('purchases:registerPayment', data),
    getSupplierLedger: (supplierId: number) =>
      ipcRenderer.invoke('purchases:getSupplierLedger', supplierId)
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    setBatch: (entries: Record<string, string>) =>
      ipcRenderer.invoke('settings:setBatch', entries),
    getActiveModules: () => ipcRenderer.invoke('settings:getActiveModules')
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApiType = typeof api
