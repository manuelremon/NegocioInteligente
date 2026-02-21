import { useEffect, useState, useCallback } from 'react'
import {
  AppShell as MantineAppShell,
  Group,
  Text,
  UnstyledButton,
  Box,
  Flex,
  Divider
} from '@mantine/core'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useRegisterStore } from '@renderer/stores/registerStore'

/* ------------------------------------------------------------------ */
/*  Navigation items with function-key shortcuts                      */
/* ------------------------------------------------------------------ */
const navItems = [
  { label: 'Ventas',     path: '/ventas',     icon: '\uD83D\uDED2', shortcut: 'F6',  keyCode: 'F6'  },
  { label: 'Inventario', path: '/inventario', icon: '\uD83D\uDCE6', shortcut: 'F5',  keyCode: 'F5'  },
  { label: 'Caja',       path: '/caja',       icon: '\uD83D\uDCB0', shortcut: 'F7',  keyCode: 'F7'  },
  { label: 'Clientes',   path: '/clientes',   icon: '\uD83D\uDC65', shortcut: 'F3',  keyCode: 'F3'  },
  { label: 'Reportes',   path: '/reportes',   icon: '\uD83D\uDCCA', shortcut: 'F8',  keyCode: 'F8'  }
]

/* ------------------------------------------------------------------ */
/*  Menu-bar items (non-functional, visual only)                      */
/* ------------------------------------------------------------------ */
const menuItems = ['Gestion', 'Busqueda', 'Herramientas', 'Ayuda']

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
export default function AppShell(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const clock = useClock()
  const { currentSession } = useRegisterStore()

  /* Global keyboard shortcuts ------------------------------------ */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const map: Record<string, string> = {
        F3: '/clientes',
        F5: '/inventario',
        F6: '/ventas',
        F7: '/caja',
        F8: '/reportes'
      }
      if (map[e.key]) {
        e.preventDefault()
        navigate(map[e.key])
      }
    },
    [navigate]
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

  return (
    <MantineAppShell
      header={{ height: 110 }}
      footer={{ height: 28 }}
      padding="md"
    >
      {/* ============================================================ */}
      {/*  HEADER: Menu bar + Toolbar                                  */}
      {/* ============================================================ */}
      <MantineAppShell.Header>
        {/* ---- Top menu bar (thin, dark navy) ---- */}
        <Box
          style={{
            background: 'linear-gradient(180deg, #1a2744 0%, #0f1b33 100%)',
            height: 28,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            paddingRight: 12,
            userSelect: 'none'
          }}
        >
          <Group gap="xs">
            {menuItems.map((item) => (
              <Text
                key={item}
                size="xs"
                fw={500}
                c="white"
                style={{
                  cursor: 'pointer',
                  padding: '2px 10px',
                  borderRadius: 2,
                  transition: 'background 150ms'
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background =
                    'rgba(255,255,255,0.15)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {item}
              </Text>
            ))}
          </Group>

          {/* App title centered-ish */}
          <Text
            size="xs"
            fw={700}
            c="gray.4"
            style={{ marginLeft: 'auto', marginRight: 16, letterSpacing: 1 }}
          >
            NEGOCIO INTELIGENTE
          </Text>
        </Box>

        {/* ---- Toolbar with large icon buttons ---- */}
        <Box
          style={{
            background: 'linear-gradient(180deg, #f0f2f5 0%, #dcdfe4 100%)',
            borderBottom: '1px solid #b0b5be',
            height: 82,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            gap: 4
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <UnstyledButton
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 90,
                  height: 70,
                  borderRadius: 4,
                  border: active
                    ? '2px solid #2b6cb0'
                    : '1px solid #a0a4ab',
                  background: active
                    ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'linear-gradient(180deg, #ffffff 0%, #e8eaed 100%)',
                  boxShadow: active
                    ? 'inset 0 1px 2px rgba(0,0,0,0.25)'
                    : '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLElement).style.background =
                      'linear-gradient(180deg, #eef1ff 0%, #d0d5e8 100%)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#6b7fcc'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLElement).style.background =
                      'linear-gradient(180deg, #ffffff 0%, #e8eaed 100%)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#a0a4ab'
                  }
                }}
              >
                <Text
                  size="xl"
                  style={{
                    fontSize: 26,
                    lineHeight: 1,
                    filter: active ? 'brightness(2)' : 'none'
                  }}
                >
                  {item.icon}
                </Text>
                <Text
                  size="xs"
                  fw={600}
                  mt={4}
                  c={active ? 'white' : 'dark.7'}
                  style={{ lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap' }}
                >
                  {item.label}
                </Text>
                <Text
                  size="10px"
                  fw={500}
                  c={active ? 'blue.1' : 'dimmed'}
                  style={{ lineHeight: 1, marginTop: 2 }}
                >
                  [{item.shortcut}]
                </Text>
              </UnstyledButton>
            )
          })}

          {/* Separator */}
          <Divider orientation="vertical" mx={8} color="gray.4" style={{ height: 56, alignSelf: 'center' }} />

          {/* Register (Caja) status indicator */}
          <Flex
            direction="column"
            align="center"
            justify="center"
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: '1px solid #a0a4ab',
              background: 'linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)',
              height: 56,
              minWidth: 100
            }}
          >
            <Text size="xs" fw={600} c="dark.5" style={{ lineHeight: 1, marginBottom: 4 }}>
              Caja
            </Text>
            <Flex align="center" gap={6}>
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: cajaAbierta ? '#22c55e' : '#ef4444',
                  boxShadow: cajaAbierta
                    ? '0 0 6px rgba(34,197,94,0.6)'
                    : '0 0 6px rgba(239,68,68,0.5)',
                  border: '1px solid rgba(0,0,0,0.15)'
                }}
              />
              <Text
                size="xs"
                fw={700}
                c={cajaAbierta ? 'green.7' : 'red.7'}
                style={{ lineHeight: 1 }}
              >
                {cajaAbierta ? 'Abierta' : 'Cerrada'}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </MantineAppShell.Header>

      {/* ============================================================ */}
      {/*  MAIN CONTENT                                                */}
      {/* ============================================================ */}
      <MantineAppShell.Main
        style={{
          backgroundColor: '#f8f9fa',
          minHeight: 'calc(100vh - 110px - 28px)'
        }}
      >
        <Outlet />
      </MantineAppShell.Main>

      {/* ============================================================ */}
      {/*  FOOTER / STATUS BAR                                         */}
      {/* ============================================================ */}
      <MantineAppShell.Footer>
        <Flex
          align="center"
          justify="space-between"
          px="sm"
          style={{
            height: 28,
            background: 'linear-gradient(180deg, #e2e4e8 0%, #cdd0d6 100%)',
            borderTop: '1px solid #b0b5be',
            userSelect: 'none'
          }}
        >
          <Text size="xs" fw={600} c="dark.6">
            NegocioInteligente
          </Text>
          <Text size="xs" fw={500} c="dark.5">
            {clock}
          </Text>
          <Text size="xs" fw={500} c="dimmed">
            v1.0.0
          </Text>
        </Flex>
      </MantineAppShell.Footer>
    </MantineAppShell>
  )
}
