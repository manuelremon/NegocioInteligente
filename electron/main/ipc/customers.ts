import { ipcMain } from 'electron'
import * as customerService from '../services/customerService'

export function registerCustomerHandlers(): void {
  ipcMain.handle('customers:list', async (_e, filters) => {
    try {
      const data = await customerService.listCustomers(filters)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('customers:getById', async (_e, id) => {
    try {
      const data = await customerService.getCustomerById(id)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('customers:create', async (_e, raw) => {
    try {
      const data = await customerService.createCustomer(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('customers:update', async (_e, raw) => {
    try {
      const data = await customerService.updateCustomer(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('customers:registerPayment', async (_e, raw) => {
    try {
      const data = await customerService.registerPayment(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('customers:getLedger', async (_e, customerId) => {
    try {
      const data = await customerService.getLedger(customerId)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
