import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  AppShell as MantineAppShell,
  Group,
  Text,
  UnstyledButton,
  Box,
  Flex,
  Tooltip,
  Indicator
} from '@mantine/core'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useRegisterStore } from '@renderer/stores/registerStore'
import type { RendererModuleDefinition, ModuleNavItem } from '@renderer/types/ipc'

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface AppShellProps {
  activeModules: RendererModuleDefinition[]
  onModulesChanged: () => Promise<void>
}

/* ------------------------------------------------------------------ */
/*  Config nav item (always visible)                                   */
/* ------------------------------------------------------------------ */
const CONFIG_NAV: ModuleNavItem = {
  id: 'configuracion',
  label: 'Config',
  icon: '\u2699\uFE0F',
  path: '/configuracion',
  shortcut: 'F9',
  keyCode: 'F9'
}

/* ------------------------------------------------------------------ */
/*  Live clock hook                                                   */
/* ------------------------------------------------------------------ */
function useClock(): string {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now.toLocaleDateString('es-VE', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }) + '  ' + now.toLocaleTimeString('es-VE')
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function AppShell({ activeModules }: AppShellProps): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const clock = useClock()
  const { currentSession } = useRegisterStore()

  /* Build nav items from active modules ----------------------------- */
  const navItems = useMemo(() => {
    const items: ModuleNavItem[] = []
    for (const mod of activeModules) {
      items.push(...mod.navItems)
    }
    return items
  }, [activeModules])

  /* Build shortcut map ---------------------------------------------- */
  const shortcutMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const item of navItems) {
      if (item.keyCode) map[item.keyCode] = item.path
    }
    map[CONFIG_NAV.keyCode!] = CONFIG_NAV.path
    return map
  }, [navItems])

  /* Global keyboard shortcuts --------------------------------------- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (shortcutMap[e.key]) {
        e.preventDefault()
        navigate(shortcutMap[e.key])
      }
    },
    [navigate, shortcutMap]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  /* -------------------------------------------------------------- */
  /*  Render                                                         */
  /* -------------------------------------------------------------- */
  const isActive = (path: string): boolean => location.pathname === path

  const cajaAbierta = currentSession !== null

  const renderNavButton = (item: ModuleNavItem): JSX.Element => {
    const active = isActive(item.path)
    return (
      <Tooltip
        key={item.path}
        label={`${item.label}${item.shortcut ? ` [${item.shortcut}]` : ''}`}
        position="right"
        withArrow
        transitionProps={{ transition: 'fade', duration: 150 }}
      >
        <UnstyledButton
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '10px 0',
            borderRadius: 12,
            background: active
              ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
              : 'transparent',
            color: active ? '#fff' : '#64748b',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (!active) {
              ;(e.currentTarget as HTMLElement).style.background = '#f1f5f9'
              ;(e.currentTarget as HTMLElement).style.color = '#334155'
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#64748b'
            }
          }}
        >
          <Text
            style={{
              fontSize: 22,
              lineHeight: 1,
              filter: active ? 'brightness(1.3) saturate(0.8)' : 'none'
            }}
          >
            {item.icon}
          </Text>
          <Text
            size="10px"
            fw={600}
            mt={4}
            style={{
              lineHeight: 1,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              color: 'inherit',
              letterSpacing: -0.2
            }}
          >
            {item.label}
          </Text>
        </UnstyledButton>
      </Tooltip>
    )
  }

  return (
    <MantineAppShell
      navbar={{ width: 80, breakpoint: 0 }}
      header={{ height: 48 }}
      padding="lg"
      styles={{
        main: {
          background: '#f8fafc',
          minHeight: '100vh'
        }
      }}
    >
      {/* ============================================================ */}
      {/*  HEADER                                                      */}
      {/* ============================================================ */}
      <MantineAppShell.Header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 96,
          paddingRight: 20
        }}
      >
        <Text size="sm" fw={700} c="#1e293b" style={{ letterSpacing: -0.3 }}>
          NEGOCIO INTELIGENTE
        </Text>

        <Group gap="lg">
          {/* Caja status */}
          <Group gap={8}>
            <Indicator
              size={9}
              offset={0}
              position="middle-start"
              color={cajaAbierta ? 'green' : 'red'}
              processing={cajaAbierta}
            >
              <Text
                size="xs"
                fw={600}
                c={cajaAbierta ? 'green.7' : 'red.6'}
                style={{ paddingLeft: 14 }}
              >
                Caja {cajaAbierta ? 'Abierta' : 'Cerrada'}
              </Text>
            </Indicator>
          </Group>

          {/* Clock */}
          <Text size="xs" fw={500} c="dimmed">
            {clock}
          </Text>

          {/* Version */}
          <Text size="xs" c="dimmed">
            v1.0.0
          </Text>
        </Group>
      </MantineAppShell.Header>

      {/* ============================================================ */}
      {/*  SIDEBAR NAVIGATION                                          */}
      {/* ============================================================ */}
      <MantineAppShell.Navbar
        style={{
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          padding: '8px'
        }}
      >
        {/* Logo area */}
        <Box
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text
            fw={800}
            size="lg"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1
            }}
          >
            NI
          </Text>
        </Box>

        {/* Nav items */}
        <Flex
          direction="column"
          gap={4}
          style={{ flex: 1, paddingTop: 8 }}
        >
          {navItems.map((item) => renderNavButton(item))}
        </Flex>

        {/* Bottom section: Config */}
        <Flex direction="column" gap={4} style={{ paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
          {renderNavButton(CONFIG_NAV)}
        </Flex>
      </MantineAppShell.Navbar>

      {/* ============================================================ */}
      {/*  MAIN CONTENT                                                */}
      {/* ============================================================ */}
      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  )
}
