import { ipcMain } from 'electron'
import * as reportsService from '../services/reportsService'

export function registerReportHandlers(): void {
  ipcMain.handle('reports:salesSummary', async (_e, filters) => {
    try {
      const data = await reportsService.salesSummary(filters)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('reports:topProducts', async (_e, filters) => {
    try {
      const data = await reportsService.topProducts(filters)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('reports:inventoryValue', async () => {
    try {
      const data = await reportsService.inventoryValue()
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('reports:lowStock', async () => {
    try {
      const data = await reportsService.lowStock()
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('reports:debtors', async () => {
    try {
      const data = await reportsService.debtors()
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('reports:cashHistory', async (_e, filters) => {
    try {
      const data = await reportsService.cashHistory(filters)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
