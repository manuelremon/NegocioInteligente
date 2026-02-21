import { ipcMain } from 'electron'
import * as categoryService from '../services/categoryService'

export function registerCategoryHandlers(): void {
  ipcMain.handle('categories:list', async () => {
    try {
      const data = await categoryService.listCategories()
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('categories:create', async (_e, raw) => {
    try {
      const data = await categoryService.createCategory(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('categories:update', async (_e, raw) => {
    try {
      const data = await categoryService.updateCategory(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('categories:remove', async (_e, id) => {
    try {
      await categoryService.removeCategory(id)
      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
