import { eq } from 'drizzle-orm'
import { getDb } from '../db/connection'
import { appSettings } from '../db/schema'

export type LicenseTier = 'basico' | 'pro' | 'enterprise'

const DEFAULTS: Record<string, string> = {
  business_name: 'Mi Negocio',
  business_address: '',
  business_taxId: '',
  license_tier: 'basico',
  license_key: '',
  enabled_modules: '[]'
}

export function getSetting(key: string): string {
  const db = getDb()
  const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get()
  return row?.value ?? DEFAULTS[key] ?? ''
}

export function setSetting(key: string, value: string): void {
  const db = getDb()
  db.insert(appSettings)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date().toISOString() }
    })
    .run()
}

export function getAllSettings(): Record<string, string> {
  const db = getDb()
  const rows = db.select().from(appSettings).all()
  const result = { ...DEFAULTS }
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

export function setSettingsBatch(entries: Record<string, string>): void {
  for (const [key, value] of Object.entries(entries)) {
    setSetting(key, value)
  }
}

export function getLicenseTier(): LicenseTier {
  const tier = getSetting('license_tier')
  if (tier === 'pro' || tier === 'enterprise') return tier
  return 'basico'
}

export function getEnabledModuleIds(): string[] {
  const raw = getSetting('enabled_modules')
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getActiveModulesInfo(): { tier: LicenseTier; enabledIds: string[] } {
  return {
    tier: getLicenseTier(),
    enabledIds: getEnabledModuleIds()
  }
}
