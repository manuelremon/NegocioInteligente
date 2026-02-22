import { useState, useEffect, useCallback } from 'react'
import {
  Tabs,
  TextInput,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Switch,
  Flex,
  Box,
  Paper,
  Title
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { LicenseTier, ActiveModulesInfo } from '@renderer/types/ipc'

/* ------------------------------------------------------------------ */
/*  Module metadata                                                    */
/* ------------------------------------------------------------------ */

interface AddonMeta {
  id: string
  name: string
  description: string
  tier: LicenseTier
  icon: string
}

const ADDON_MODULES: AddonMeta[] = [
  { id: 'tienda-nube', name: 'Tienda Nube', description: 'Sincroniza productos y pedidos con tu tienda online', tier: 'pro', icon: '🛒' },
  { id: 'whatsapp', name: 'WhatsApp', description: 'Envio de comprobantes y notificaciones por WhatsApp', tier: 'pro', icon: '💬' },
  { id: 'arca', name: 'ARCA (AFIP)', description: 'Facturacion electronica y comunicacion con AFIP', tier: 'enterprise', icon: '🏛' },
  { id: 'camaras', name: 'Camaras', description: 'Monitoreo de camaras de seguridad integrado', tier: 'enterprise', icon: '📷' },
  { id: 'multi-sucursal', name: 'Multi-sucursal', description: 'Gestion centralizada de multiples sucursales', tier: 'enterprise', icon: '🏢' }
]

const TIER_ORDER: Record<LicenseTier, number> = { basico: 0, pro: 1, enterprise: 2 }

/* ------------------------------------------------------------------ */
/*  Plan definitions                                                   */
/* ------------------------------------------------------------------ */

interface PlanDef {
  id: LicenseTier
  name: string
  subtitle: string
  price: string
  features: string[]
  gradient: string
  accentColor: string
  badgeColor: string
}

const PLANS: PlanDef[] = [
  {
    id: 'basico',
    name: 'Basico',
    subtitle: 'Para empezar',
    price: 'Gratis',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    accentColor: '#6366f1',
    badgeColor: 'gray',
    features: ['Ventas / POS', 'Inventario completo', 'Gestion de compras', 'Caja registradora', 'Cartera de clientes', 'Reportes basicos']
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'El mas popular',
    price: 'Consultar',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
    accentColor: '#4f46e5',
    badgeColor: 'indigo',
    features: ['Todo de Basico +', 'Tienda Nube integrada', 'WhatsApp Business', 'Reportes avanzados', 'Soporte prioritario']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Sin limites',
    price: 'Consultar',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    accentColor: '#7c3aed',
    badgeColor: 'violet',
    features: ['Todo de Pro +', 'ARCA / Factura electronica', 'Camaras de seguridad', 'Multi-sucursal', 'Soporte dedicado 24/7']
  }
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ConfiguracionPage(): JSX.Element {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [activeModules, setActiveModules] = useState<ActiveModulesInfo>({ tier: 'basico', enabledIds: [] })
  const [loading, setLoading] = useState(true)

  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessTaxId, setBusinessTaxId] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [licenseKey, setLicenseKey] = useState('')

  const loadSettings = useCallback(async () => {
    const res = await window.api.settings.getAll()
    if (res.ok && res.data) {
      const data = res.data as Record<string, string>
      setSettings(data)
      setBusinessName(data.business_name || '')
      setBusinessAddress(data.business_address || '')
      setBusinessTaxId(data.business_taxId || '')
      setBusinessPhone(data.business_phone || '')
      setLicenseKey(data.license_key || '')
    }
    const modRes = await window.api.settings.getActiveModules()
    if (modRes.ok && modRes.data) {
      setActiveModules(modRes.data as ActiveModulesInfo)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const handleSaveBusiness = async (): Promise<void> => {
    await window.api.settings.setBatch({
      business_name: businessName,
      business_address: businessAddress,
      business_taxId: businessTaxId,
      business_phone: businessPhone
    })
    notifications.show({ title: 'Guardado', message: 'Datos del negocio actualizados', color: 'green' })
  }

  const handleSaveLicense = async (): Promise<void> => {
    await window.api.settings.setBatch({ license_key: licenseKey })
    await loadSettings()
    notifications.show({ title: 'Licencia', message: 'Clave de licencia actualizada', color: 'green' })
  }

  const handleToggleModule = async (moduleId: string, enabled: boolean): Promise<void> => {
    let current: string[] = []
    try { current = JSON.parse(settings.enabled_modules || '[]') } catch { current = [] }
    const next = enabled
      ? [...new Set([...current, moduleId])]
      : current.filter((id: string) => id !== moduleId)
    await window.api.settings.set('enabled_modules', JSON.stringify(next))
    await loadSettings()
  }

  const currentTier = activeModules.tier
  const enabledCount = activeModules.enabledIds.length
  const totalModules = ADDON_MODULES.length

  if (loading) return <Text p="xl" size="sm" c="dimmed">Cargando configuracion...</Text>

  return (
    <Stack gap="md">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Title order={3} c="#1e293b">Configuracion</Title>
        <Badge
          size="md"
          variant="light"
          radius="md"
          color={currentTier === 'enterprise' ? 'violet' : currentTier === 'pro' ? 'indigo' : 'gray'}
        >
          Plan {currentTier.toUpperCase()}
        </Badge>
      </Flex>

      <Tabs defaultValue="negocio" radius="md">
        <Tabs.List>
          <Tabs.Tab value="negocio" style={{ fontSize: 13, fontWeight: 600 }}>Negocio</Tabs.Tab>
          <Tabs.Tab value="licencia" style={{ fontSize: 13, fontWeight: 600 }}>Licencia y Planes</Tabs.Tab>
          <Tabs.Tab value="modulos" style={{ fontSize: 13, fontWeight: 600 }}>
            Modulos
            <Badge size="xs" color="indigo" variant="filled" ml={6} radius="xl">{enabledCount}</Badge>
          </Tabs.Tab>
        </Tabs.List>

        {/* ============ TAB NEGOCIO ============ */}
        <Tabs.Panel value="negocio" pt="md">
          <Flex gap="lg" wrap="wrap" align="flex-start">
            {/* Form */}
            <Paper
              withBorder
              radius="lg"
              p="lg"
              bg="white"
              style={{ flex: 1, minWidth: 320, maxWidth: 480 }}
            >
              <Text size="sm" fw={700} c="#1e293b" mb="md">Datos del Negocio</Text>
              <Stack gap="sm">
                <TextInput
                  label="Nombre del negocio"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.currentTarget.value)}
                  size="sm"
                  radius="md"
                />
                <TextInput
                  label="Direccion"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.currentTarget.value)}
                  size="sm"
                  radius="md"
                />
                <Group grow>
                  <TextInput
                    label="CUIT"
                    value={businessTaxId}
                    onChange={(e) => setBusinessTaxId(e.currentTarget.value)}
                    size="sm"
                    radius="md"
                    placeholder="XX-XXXXXXXX-X"
                  />
                  <TextInput
                    label="Telefono"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.currentTarget.value)}
                    size="sm"
                    radius="md"
                  />
                </Group>
                <Group justify="flex-end" mt="xs">
                  <Button color="indigo" radius="md" onClick={handleSaveBusiness}>
                    Guardar Cambios
                  </Button>
                </Group>
              </Stack>
            </Paper>

            {/* Ticket preview */}
            <Paper
              withBorder
              radius="lg"
              p="lg"
              bg="white"
              style={{ width: 260 }}
            >
              <Text size="sm" fw={700} c="#1e293b" mb="md">Vista Previa - Ticket</Text>
              <Box style={{
                border: '1px dashed #cbd5e1',
                borderRadius: 8,
                padding: 16,
                background: '#fafbfc',
                fontFamily: '"Courier New", Courier, monospace'
              }}>
                <Text size="xs" ta="center" fw={700} style={{ letterSpacing: 0.5 }}>
                  {businessName || 'NOMBRE NEGOCIO'}
                </Text>
                <Text size="10px" ta="center" c="dimmed" mt={3}>
                  {businessAddress || 'Direccion'}
                </Text>
                <Text size="10px" ta="center" c="dimmed">
                  CUIT: {businessTaxId || 'XX-XXXXXXXX-X'}
                </Text>
                <Text size="10px" ta="center" c="dimmed">
                  Tel: {businessPhone || '---'}
                </Text>
                <Box style={{ borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />
                <Text size="10px" ta="center" c="dimmed" fw={600}>TICKET DE VENTA</Text>
                <Box style={{ borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />
                <Flex justify="space-between">
                  <Text size="10px" c="dimmed">Producto demo</Text>
                  <Text size="10px" c="dimmed">$1.500</Text>
                </Flex>
                <Flex justify="space-between" mt={2}>
                  <Text size="10px" c="dimmed">Otro producto</Text>
                  <Text size="10px" c="dimmed">$800</Text>
                </Flex>
                <Box style={{ borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />
                <Flex justify="space-between">
                  <Text size="10px" fw={700}>TOTAL</Text>
                  <Text size="10px" fw={700}>$2.300</Text>
                </Flex>
              </Box>
            </Paper>
          </Flex>
        </Tabs.Panel>

        {/* ============ TAB LICENCIA ============ */}
        <Tabs.Panel value="licencia" pt="md">
          <Stack gap="lg">
            {/* Pricing cards */}
            <Flex gap="md" wrap="wrap">
              {PLANS.map((plan) => {
                const isActive = currentTier === plan.id
                return (
                  <Paper
                    key={plan.id}
                    withBorder
                    radius="lg"
                    style={{
                      flex: 1,
                      minWidth: 220,
                      maxWidth: 300,
                      overflow: 'hidden',
                      borderColor: isActive ? plan.accentColor : '#e2e8f0',
                      borderWidth: isActive ? 2 : 1,
                      transform: isActive ? 'scale(1.02)' : 'none',
                      transition: 'all 200ms ease'
                    }}
                  >
                    {/* Card header */}
                    <Box style={{
                      background: plan.gradient,
                      padding: '18px 20px',
                      position: 'relative'
                    }}>
                      {isActive && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="lime"
                          radius="xl"
                          style={{ position: 'absolute', top: 10, right: 10 }}
                        >
                          ACTIVO
                        </Badge>
                      )}
                      <Text size="lg" fw={800} c="white">{plan.name}</Text>
                      <Text size="xs" c="rgba(255,255,255,0.75)">{plan.subtitle}</Text>
                    </Box>

                    {/* Price */}
                    <Box style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <Text size="xl" fw={800} c={plan.accentColor}>{plan.price}</Text>
                    </Box>

                    {/* Features */}
                    <Box style={{ padding: '14px 20px' }}>
                      <Stack gap={8}>
                        {plan.features.map((feat) => (
                          <Group key={feat} gap={10} wrap="nowrap">
                            <Box style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: isActive ? plan.accentColor : '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Text size="9px" c="white" fw={700}>✓</Text>
                            </Box>
                            <Text size="xs" c={isActive ? '#1e293b' : '#94a3b8'}>{feat}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  </Paper>
                )
              })}
            </Flex>

            {/* License key */}
            <Paper
              withBorder
              radius="lg"
              p="lg"
              bg="white"
              style={{ maxWidth: 480 }}
            >
              <Text size="sm" fw={700} c="#1e293b" mb="md">Activar / Cambiar Licencia</Text>
              <Flex gap="sm" align="flex-end">
                <TextInput
                  label="Clave de licencia"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.currentTarget.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  size="sm"
                  radius="md"
                  style={{ flex: 1 }}
                />
                <Button color="indigo" radius="md" onClick={handleSaveLicense}>
                  Activar
                </Button>
              </Flex>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* ============ TAB MODULOS ============ */}
        <Tabs.Panel value="modulos" pt="md">
          <Stack gap="md">
            <Flex wrap="wrap" gap="md">
              {ADDON_MODULES.map((mod) => {
                const tierOk = TIER_ORDER[currentTier] >= TIER_ORDER[mod.tier]
                const isEnabled = activeModules.enabledIds.includes(mod.id)

                const tierBadgeColor = mod.tier === 'enterprise' ? 'violet' : 'indigo'

                return (
                  <Paper
                    key={mod.id}
                    withBorder
                    radius="lg"
                    style={{
                      width: 300,
                      overflow: 'hidden',
                      borderColor: isEnabled ? '#86efac' : '#e2e8f0',
                      opacity: tierOk ? 1 : 0.55,
                      transition: 'all 150ms ease'
                    }}
                  >
                    {/* Top accent strip */}
                    <Box style={{
                      height: 3,
                      background: isEnabled
                        ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                        : !tierOk
                          ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                          : '#e2e8f0'
                    }} />

                    <Box style={{ padding: '16px 18px' }}>
                      <Flex gap={14} align="flex-start">
                        {/* Icon */}
                        <Text style={{ fontSize: 32, lineHeight: 1, flexShrink: 0, paddingTop: 2 }}>
                          {mod.icon}
                        </Text>

                        {/* Info */}
                        <Stack gap={6} style={{ flex: 1 }}>
                          <Flex justify="space-between" align="center" wrap="nowrap">
                            <Text size="sm" fw={700} c="#1e293b">{mod.name}</Text>
                            <Badge size="xs" color={tierBadgeColor} variant="light" radius="md">
                              {mod.tier.toUpperCase()}
                            </Badge>
                          </Flex>
                          <Text size="xs" c="#64748b" lineClamp={2} style={{ lineHeight: 1.5 }}>
                            {mod.description}
                          </Text>
                          <Box mt={4}>
                            <Switch
                              label={
                                <Text size="xs" fw={500} c={isEnabled ? 'green.7' : 'dimmed'}>
                                  {isEnabled ? 'Activado' : 'Desactivado'}
                                </Text>
                              }
                              checked={isEnabled}
                              disabled={!tierOk}
                              size="xs"
                              color="green"
                              onChange={(e) => handleToggleModule(mod.id, e.currentTarget.checked)}
                            />
                            {!tierOk && (
                              <Text size="10px" c="red.6" mt={4} fw={600}>
                                Requiere plan {mod.tier.toUpperCase()}
                              </Text>
                            )}
                          </Box>
                        </Stack>
                      </Flex>
                    </Box>
                  </Paper>
                )
              })}
            </Flex>

            {/* Status bar */}
            <Paper withBorder radius="md" p="xs" px="md" bg="#f8fafc">
              <Flex justify="space-between" align="center">
                <Text size="xs" fw={500} c="#64748b">
                  {enabledCount} modulos activos de {totalModules} disponibles
                </Text>
                <Text size="xs" fw={500} c="#64748b">
                  Desbloqueados:{' '}
                  <Text span fw={700} c="#4f46e5">
                    {ADDON_MODULES.filter(m => TIER_ORDER[currentTier] >= TIER_ORDER[m.tier]).length}/{totalModules}
                  </Text>
                </Text>
              </Flex>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
