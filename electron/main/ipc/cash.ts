import { ipcMain } from 'electron'
import * as cashService from '../services/cashService'

export function registerCashHandlers(): void {
  ipcMain.handle('cash:openSession', async (_e, raw) => {
    try {
      const data = await cashService.openSession(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('cash:closeSession', async (_e, raw) => {
    try {
      const data = await cashService.closeSession(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('cash:getActiveSession', async () => {
    try {
      const data = await cashService.getActiveSession()
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('cash:addMovement', async (_e, raw) => {
    try {
      const data = await cashService.addMovement(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('cash:getSessionHistory', async () => {
    try {
      const data = await cashService.getSessionHistory()
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('cash:getSessionDetail', async (_e, id) => {
    try {
      const data = await cashService.getSessionDetail(id)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
