import { ipcMain } from 'electron'
import * as salesService from '../services/salesService'

export function registerSalesHandlers(): void {
  ipcMain.handle('sales:complete', async (_e, raw) => {
    try {
      const data = await salesService.completeSale(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('sales:list', async (_e, filters) => {
    try {
      const data = await salesService.listSales(filters)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('sales:getById', async (_e, id) => {
    try {
      const data = await salesService.getSaleById(id)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
