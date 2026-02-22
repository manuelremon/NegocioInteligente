import { ipcMain } from 'electron'
import * as purchaseService from '../services/purchaseService'

export function registerPurchaseHandlers(): void {
  ipcMain.handle('purchases:listSuppliers', async (_e, filters) => {
    try {
      const data = await purchaseService.listSuppliers(filters)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('purchases:createSupplier', async (_e, raw) => {
    try {
      const data = await purchaseService.createSupplier(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('purchases:updateSupplier', async (_e, raw) => {
    try {
      const data = await purchaseService.updateSupplier(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('purchases:list', async (_e, filters) => {
    try {
      const data = await purchaseService.listPurchases(filters)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('purchases:getById', async (_e, id) => {
    try {
      const data = await purchaseService.getPurchaseById(id)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('purchases:create', async (_e, raw) => {
    try {
      const data = await purchaseService.createPurchase(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('purchases:updateStatus', async (_e, id, status) => {
    try {
      const data = await purchaseService.updatePurchaseStatus(id, status)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('purchases:registerPayment', async (_e, raw) => {
    try {
      const data = await purchaseService.registerSupplierPayment(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('purchases:getSupplierLedger', async (_e, supplierId) => {
    try {
      const data = await purchaseService.getSupplierLedger(supplierId)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
