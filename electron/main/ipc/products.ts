import { ipcMain } from 'electron'
import * as productService from '../services/productService'

export function registerProductHandlers(): void {
  ipcMain.handle('products:list', async (_e, filters) => {
    try {
      const data = await productService.listProducts(filters)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('products:getById', async (_e, id) => {
    try {
      const data = await productService.getProductById(id)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('products:create', async (_e, raw) => {
    try {
      const data = await productService.createProduct(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('products:update', async (_e, raw) => {
    try {
      const data = await productService.updateProduct(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('products:adjustStock', async (_e, raw) => {
    try {
      const data = await productService.adjustStock(raw)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('products:search', async (_e, query) => {
    try {
      const data = await productService.searchProducts(query)
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
