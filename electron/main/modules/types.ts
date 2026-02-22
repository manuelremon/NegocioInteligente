export type LicenseTier = 'basico' | 'pro' | 'enterprise'

export interface ModuleNavItem {
  id: string
  label: string
  icon: string
  path: string
  shortcut?: string
  keyCode?: string
}

export interface ModuleDefinition {
  id: string
  name: string
  description: string
  version: string
  tier: LicenseTier
  isCore: boolean
  navItems: ModuleNavItem[]
  registerHandlers: () => void
  pageComponentId: string
}
