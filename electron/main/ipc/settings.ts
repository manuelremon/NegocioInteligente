import { ipcMain } from 'electron'
import * as settingsService from '../services/settingsService'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getAll', () => {
    try {
      return { ok: true, data: settingsService.getAllSettings() }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('settings:get', (_e, key: string) => {
    try {
      return { ok: true, data: settingsService.getSetting(key) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('settings:set', (_e, key: string, value: string) => {
    try {
      settingsService.setSetting(key, value)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('settings:setBatch', (_e, entries: Record<string, string>) => {
    try {
      settingsService.setSettingsBatch(entries)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('settings:getActiveModules', () => {
    try {
      return { ok: true, data: settingsService.getActiveModulesInfo() }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
