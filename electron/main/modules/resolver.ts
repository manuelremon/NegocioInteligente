import type { ModuleDefinition, LicenseTier } from './types'
import { MODULE_REGISTRY } from './registry'
import { getLicenseTier, getEnabledModuleIds } from '../services/settingsService'

const TIER_ORDER: Record<LicenseTier, number> = { basico: 0, pro: 1, enterprise: 2 }

export interface ModuleWithStatus {
  id: string
  name: string
  description: string
  tier: LicenseTier
  isCore: boolean
  isAvailable: boolean  // tier is sufficient
  isEnabled: boolean    // user toggled on
  isActive: boolean     // available AND (core OR enabled)
}

export function getActiveModules(): ModuleDefinition[] {
  const tier = getLicenseTier()
  const enabledIds = getEnabledModuleIds()
  const tierLevel = TIER_ORDER[tier]

  return MODULE_REGISTRY.filter((mod) => {
    if (mod.isCore) return true
    const modTierLevel = TIER_ORDER[mod.tier]
    return modTierLevel <= tierLevel && enabledIds.includes(mod.id)
  })
}

export function getModulesWithStatus(): ModuleWithStatus[] {
  const tier = getLicenseTier()
  const enabledIds = getEnabledModuleIds()
  const tierLevel = TIER_ORDER[tier]

  return MODULE_REGISTRY.map((mod) => {
    const isAvailable = TIER_ORDER[mod.tier] <= tierLevel
    const isEnabled = mod.isCore || enabledIds.includes(mod.id)
    return {
      id: mod.id,
      name: mod.name,
      description: mod.description,
      tier: mod.tier,
      isCore: mod.isCore,
      isAvailable,
      isEnabled,
      isActive: isAvailable && isEnabled
    }
  })
}
