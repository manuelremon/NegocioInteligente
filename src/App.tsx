import { Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingOverlay } from '@mantine/core'
import AppShell from './components/AppShell'
import { RENDERER_MODULE_REGISTRY } from './modules/registry'
import { PAGE_COMPONENTS } from './modules/pageRegistry'
import type { ActiveModulesInfo, RendererModuleDefinition } from './types/ipc'

const TIER_ORDER: Record<string, number> = { basico: 0, pro: 1, enterprise: 2 }

function App(): JSX.Element {
  const [activeModules, setActiveModules] = useState<RendererModuleDefinition[]>([])
  const [loading, setLoading] = useState(true)

  const loadModules = async (): Promise<void> => {
    try {
      const res = await window.api.settings.getActiveModules()
      if (res.ok && res.data) {
        const info = res.data as ActiveModulesInfo
        const tierLevel = TIER_ORDER[info.tier] ?? 0

        const active = RENDERER_MODULE_REGISTRY.filter((mod) => {
          if (mod.isCore) return true
          const modTierLevel = TIER_ORDER[mod.tier] ?? 0
          return modTierLevel <= tierLevel && info.enabledIds.includes(mod.id)
        })
        setActiveModules(active)
      } else {
        // Fallback: show core modules
        setActiveModules(RENDERER_MODULE_REGISTRY.filter((m) => m.isCore))
      }
    } catch {
      setActiveModules(RENDERER_MODULE_REGISTRY.filter((m) => m.isCore))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadModules()
  }, [])

  if (loading) return <LoadingOverlay visible />

  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <Routes>
        <Route element={<AppShell activeModules={activeModules} onModulesChanged={loadModules} />}>
          <Route path="/" element={<Navigate to="/ventas" replace />} />
          {activeModules.flatMap((mod) =>
            mod.navItems.map((nav) => {
              const PageComp = PAGE_COMPONENTS[mod.pageComponentId]
              if (!PageComp) return null
              return <Route key={nav.path} path={nav.path} element={<PageComp />} />
            })
          )}
          {/* Config route (always available) */}
          {(() => {
            const ConfigPage = PAGE_COMPONENTS['configuracion']
            return ConfigPage ? <Route path="/configuracion" element={<ConfigPage />} /> : null
          })()}
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/ventas" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
