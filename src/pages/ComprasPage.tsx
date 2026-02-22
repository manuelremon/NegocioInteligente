import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Center,
  Flex,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Box
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import type { Supplier, Purchase } from '@renderer/types/ipc'
import SupplierFormModal from '@renderer/components/purchases/SupplierFormModal'
import PurchaseFormModal from '@renderer/components/purchases/PurchaseFormModal'
import SupplierPaymentModal from '@renderer/components/purchases/SupplierPaymentModal'

const fmt = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const statusColors: Record<string, string> = {
  completed: 'green',
  draft: 'gray',
  cancelled: 'red'
}

const statusLabels: Record<string, string> = {
  completed: 'Completada',
  draft: 'Borrador',
  cancelled: 'Cancelada'
}

const paymentStatusColors: Record<string, string> = {
  paid: 'green',
  partial: 'orange',
  pending: 'red'
}

const paymentStatusLabels: Record<string, string> = {
  paid: 'Pagada',
  partial: 'Parcial',
  pending: 'Pendiente'
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  credit: 'Credito'
}

export default function ComprasPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string | null>('compras')

  // Purchases state
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<string | null>(null)
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState<string | null>(null)

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [debouncedSupplierSearch] = useDebouncedValue(supplierSearch, 300)
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined)

  // Payment state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null)

  // Selected row
  const [selectedPurchaseRow, setSelectedPurchaseRow] = useState<number | null>(null)
  const [selectedSupplierRow, setSelectedSupplierRow] = useState<number | null>(null)

  /* ---- Fetchers ---- */
  const fetchPurchases = useCallback(async () => {
    setLoadingPurchases(true)
    try {
      const filters: Record<string, unknown> = {}
      if (purchaseStatusFilter) filters.status = purchaseStatusFilter
      if (purchaseSupplierFilter) filters.supplierId = Number(purchaseSupplierFilter)
      const res = await window.api.purchases.list(filters)
      if (res.ok && res.data) setPurchases(res.data)
    } catch { /* ignore */ }
    finally { setLoadingPurchases(false) }
  }, [purchaseStatusFilter, purchaseSupplierFilter])

  const fetchSuppliers = useCallback(async () => {
    setLoadingSuppliers(true)
    try {
      const filters: Record<string, unknown> = {}
      if (debouncedSupplierSearch) filters.search = debouncedSupplierSearch
      const res = await window.api.purchases.listSuppliers(filters)
      if (res.ok && res.data) setSuppliers(res.data)
    } catch { /* ignore */ }
    finally { setLoadingSuppliers(false) }
  }, [debouncedSupplierSearch])

  const fetchAllSuppliers = useCallback(async () => {
    const res = await window.api.purchases.listSuppliers()
    if (res.ok && res.data) setSuppliers(res.data)
  }, [])

  /* ---- Effects ---- */
  useEffect(() => {
    fetchAllSuppliers()
  }, [fetchAllSuppliers])

  useEffect(() => {
    if (activeTab === 'compras') fetchPurchases()
  }, [activeTab, fetchPurchases])

  useEffect(() => {
    if (activeTab === 'proveedores') fetchSuppliers()
  }, [activeTab, fetchSuppliers])

  useEffect(() => {
    if (activeTab === 'cuentas') fetchAllSuppliers()
  }, [activeTab, fetchAllSuppliers])

  /* ---- Computed ---- */
  const supplierSelectData = useMemo(
    () => [
      { value: '', label: 'TODOS' },
      ...suppliers.map((s) => ({ value: String(s.id), label: s.name }))
    ],
    [suppliers]
  )

  const suppliersWithDebt = useMemo(
    () => suppliers.filter((s) => s.currentBalance > 0),
    [suppliers]
  )

  const totalDebt = suppliersWithDebt.reduce((s, sup) => s + sup.currentBalance, 0)
  const totalPurchases = purchases.reduce((s, p) => s + p.total, 0)

  /* ---- Handlers ---- */
  const handleCancelPurchase = async (purchase: Purchase): Promise<void> => {
    if (!window.confirm(`Cancelar la compra ${purchase.receiptNumber}? Esto revertira el stock.`)) return
    const res = await window.api.purchases.updateStatus(purchase.id, 'cancelled')
    if (res.ok) {
      notifications.show({ title: 'Compra cancelada', message: 'Stock revertido exitosamente', color: 'green' })
      fetchPurchases()
      fetchAllSuppliers()
    } else {
      notifications.show({ title: 'Error', message: res.error ?? 'No se pudo cancelar', color: 'red' })
    }
  }

  const handleToggleSupplierActive = async (supplier: Supplier): Promise<void> => {
    const res = await window.api.purchases.updateSupplier({
      id: supplier.id,
      isActive: !supplier.isActive
    })
    if (res.ok) {
      notifications.show({
        title: 'OK',
        message: `${supplier.name} ${supplier.isActive ? 'desactivado' : 'activado'}`,
        color: 'green'
      })
      fetchSuppliers()
    }
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Flex align="center" justify="space-between">
        <Text size="lg" fw={700} c="#1e293b">Gestion de Compras</Text>
      </Flex>

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
        <Tabs.List>
          <Tabs.Tab value="compras" style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            Compras
          </Tabs.Tab>
          <Tabs.Tab value="proveedores" style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            Proveedores
          </Tabs.Tab>
          <Tabs.Tab value="cuentas" style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            Cuentas por Pagar
            {suppliersWithDebt.length > 0 && (
              <Badge size="xs" color="red" ml={6} variant="filled">{suppliersWithDebt.length}</Badge>
            )}
          </Tabs.Tab>
        </Tabs.List>

        {/* ============ TAB: COMPRAS ============ */}
        <Tabs.Panel value="compras" pt="md">
          <Stack gap="sm">
            <Paper withBorder radius="md" p="sm" bg="white">
              <Flex gap="md" align="center" wrap="wrap">
                <Group gap={6}>
                  <Text size="xs" fw={600} c="#64748b">Proveedor:</Text>
                  <Select
                    data={supplierSelectData}
                    value={purchaseSupplierFilter ?? ''}
                    onChange={(v) => setPurchaseSupplierFilter(v === '' ? null : v)}
                    size="xs"
                    radius="md"
                    style={{ width: 180 }}
                  />
                </Group>
                <Group gap={6}>
                  <Text size="xs" fw={600} c="#64748b">Estado:</Text>
                  <Select
                    data={[
                      { value: '', label: 'TODOS' },
                      { value: 'completed', label: 'Completada' },
                      { value: 'cancelled', label: 'Cancelada' }
                    ]}
                    value={purchaseStatusFilter ?? ''}
                    onChange={(v) => setPurchaseStatusFilter(v === '' ? null : v)}
                    size="xs"
                    radius="md"
                    style={{ width: 140 }}
                  />
                </Group>
                <Box style={{ flex: 1 }} />
                <Group gap={6}>
                  <Text size="xs" fw={600} c="#64748b">Total:</Text>
                  <Text size="sm" fw={700} c="#4f46e5">{fmt(totalPurchases)}</Text>
                </Group>
                <Button
                  size="xs"
                  radius="md"
                  color="indigo"
                  onClick={() => setPurchaseModalOpen(true)}
                >
                  Nueva Compra
                </Button>
              </Flex>
            </Paper>

            {loadingPurchases ? (
              <Center py="xl"><Loader size="sm" color="indigo" /></Center>
            ) : (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table.ScrollContainer minWidth={900}>
                  <Table striped highlightOnHover style={{ fontSize: 13 }}>
                    <Table.Thead>
                      <Table.Tr style={{ background: '#f8fafc' }}>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Fecha</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Nro. Factura</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Proveedor</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Pago</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'right' }}>Subtotal</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'right' }}>IVA</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'right' }}>Total</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Estado Pago</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Estado</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {purchases.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={10}>
                            <Text ta="center" c="#64748b" py="lg" size="sm">No se encontraron compras</Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        purchases.map((p) => {
                          const isSelected = selectedPurchaseRow === p.id
                          return (
                            <Table.Tr
                              key={p.id}
                              onClick={() => setSelectedPurchaseRow(p.id)}
                              style={{
                                cursor: 'pointer',
                                background: isSelected ? '#eef2ff' : undefined
                              }}
                            >
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#1e293b' }}>
                                {new Date(p.createdAt).toLocaleDateString('es-AR')}
                              </Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#1e293b' }}>{p.receiptNumber}</Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#1e293b' }}>{p.supplierName ?? '-'}</Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#64748b' }}>
                                {paymentMethodLabels[p.paymentMethod] ?? p.paymentMethod}
                              </Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', textAlign: 'right', color: '#1e293b' }}>{fmt(p.subtotal)}</Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', textAlign: 'right', color: '#64748b' }}>{fmt(p.taxTotal)}</Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{fmt(p.total)}</Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                <Badge
                                  size="sm"
                                  variant="light"
                                  radius="md"
                                  color={paymentStatusColors[p.paymentStatus] ?? 'gray'}
                                >
                                  {paymentStatusLabels[p.paymentStatus] ?? p.paymentStatus}
                                </Badge>
                              </Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                <Badge
                                  size="sm"
                                  radius="md"
                                  color={statusColors[p.status] ?? 'gray'}
                                  variant={p.status === 'cancelled' ? 'filled' : 'light'}
                                >
                                  {statusLabels[p.status] ?? p.status}
                                </Badge>
                              </Table.Td>
                              <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                {p.status === 'completed' && (
                                  <Button
                                    variant="subtle"
                                    size="compact-xs"
                                    color="red"
                                    radius="md"
                                    style={{ fontSize: 12 }}
                                    onClick={(e) => { e.stopPropagation(); handleCancelPurchase(p) }}
                                  >
                                    Anular
                                  </Button>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          )
                        })
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
            )}

            <Paper withBorder radius="md" p="xs" px="md" bg="#f8fafc">
              <Flex justify="space-between" align="center">
                <Text size="xs" fw={500} c="#64748b">{purchases.length} resultados</Text>
                <Text size="xs" fw={600} c="#1e293b">
                  Total: <Text span fw={700} c="#4f46e5">{fmt(totalPurchases)}</Text>
                </Text>
              </Flex>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* ============ TAB: PROVEEDORES ============ */}
        <Tabs.Panel value="proveedores" pt="md">
          <Stack gap="sm">
            <Paper withBorder radius="md" p="sm" bg="white">
              <Flex gap="md" align="center" wrap="wrap">
                <Group gap={6}>
                  <Text size="xs" fw={600} c="#64748b">Buscar:</Text>
                  <TextInput
                    placeholder="Nombre del proveedor..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.currentTarget.value)}
                    size="xs"
                    radius="md"
                    style={{ width: 220 }}
                  />
                </Group>
                <Box style={{ flex: 1 }} />
                <Button
                  size="xs"
                  radius="md"
                  color="indigo"
                  onClick={() => { setEditingSupplier(undefined); setSupplierModalOpen(true) }}
                >
                  Nuevo Proveedor
                </Button>
              </Flex>
            </Paper>

            {loadingSuppliers ? (
              <Center py="xl"><Loader size="sm" color="indigo" /></Center>
            ) : (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table striped highlightOnHover style={{ fontSize: 13 }}>
                  <Table.Thead>
                    <Table.Tr style={{ background: '#f8fafc' }}>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Nombre</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Telefono</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Email</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>CUIT</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'right' }}>Deuda</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Estado</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {suppliers.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={7}>
                          <Text ta="center" c="#64748b" py="lg" size="sm">No se encontraron proveedores</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      suppliers.map((s) => {
                        const isSelected = selectedSupplierRow === s.id
                        return (
                          <Table.Tr
                            key={s.id}
                            onClick={() => setSelectedSupplierRow(s.id)}
                            style={{
                              cursor: 'pointer',
                              background: isSelected ? '#eef2ff' : undefined
                            }}
                          >
                            <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#1e293b', fontWeight: 500 }}>{s.name}</Table.Td>
                            <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#64748b' }}>{s.phone ?? '-'}</Table.Td>
                            <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#64748b' }}>{s.email ?? '-'}</Table.Td>
                            <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#64748b' }}>{s.taxId ?? '-'}</Table.Td>
                            <Table.Td style={{
                              fontSize: 13,
                              padding: '8px 12px',
                              whiteSpace: 'nowrap',
                              textAlign: 'right',
                              color: s.currentBalance > 0 ? '#dc2626' : '#1e293b',
                              fontWeight: s.currentBalance > 0 ? 700 : 400
                            }}>
                              {fmt(s.currentBalance)}
                            </Table.Td>
                            <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              <Badge size="sm" variant="light" radius="md" color={s.isActive ? 'green' : 'gray'}>
                                {s.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              <Group gap={4} wrap="nowrap">
                                <Button
                                  variant="subtle"
                                  size="compact-xs"
                                  color="indigo"
                                  radius="md"
                                  style={{ fontSize: 12 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingSupplier(s)
                                    setSupplierModalOpen(true)
                                  }}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="subtle"
                                  size="compact-xs"
                                  color={s.isActive ? 'red' : 'green'}
                                  radius="md"
                                  style={{ fontSize: 12 }}
                                  onClick={(e) => { e.stopPropagation(); handleToggleSupplierActive(s) }}
                                >
                                  {s.isActive ? 'Des.' : 'Act.'}
                                </Button>
                                {s.currentBalance > 0 && (
                                  <Button
                                    variant="subtle"
                                    size="compact-xs"
                                    color="teal"
                                    radius="md"
                                    style={{ fontSize: 12 }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPaymentSupplier(s)
                                      setPaymentModalOpen(true)
                                    }}
                                  >
                                    Pagar
                                  </Button>
                                )}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        )
                      })
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            <Paper withBorder radius="md" p="xs" px="md" bg="#f8fafc">
              <Text size="xs" fw={500} c="#64748b">{suppliers.length} resultados</Text>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* ============ TAB: CUENTAS POR PAGAR ============ */}
        <Tabs.Panel value="cuentas" pt="md">
          <Stack gap="sm">
            <Paper withBorder radius="md" p="sm" bg="white">
              <Flex gap="md" align="center" wrap="wrap">
                <Text size="sm" fw={600} c="#1e293b">Proveedores con deuda pendiente</Text>
                <Box style={{ flex: 1 }} />
                <Group gap={6}>
                  <Text size="xs" fw={600} c="#64748b">Deuda Total:</Text>
                  <Text size="sm" fw={700} c="#dc2626">{fmt(totalDebt)}</Text>
                </Group>
              </Flex>
            </Paper>

            <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
              <Table striped highlightOnHover style={{ fontSize: 13 }}>
                <Table.Thead>
                  <Table.Tr style={{ background: '#f8fafc' }}>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Proveedor</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Telefono</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Email</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'right' }}>Deuda</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '10px 12px', whiteSpace: 'nowrap' }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {suppliersWithDebt.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text ta="center" c="#64748b" py="lg" size="sm">No hay proveedores con deuda pendiente</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    suppliersWithDebt.map((s) => (
                      <Table.Tr key={s.id}>
                        <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#1e293b', fontWeight: 500 }}>{s.name}</Table.Td>
                        <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#64748b' }}>{s.phone ?? '-'}</Table.Td>
                        <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', color: '#64748b' }}>{s.email ?? '-'}</Table.Td>
                        <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                          {fmt(s.currentBalance)}
                        </Table.Td>
                        <Table.Td style={{ fontSize: 13, padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <Button
                            variant="light"
                            size="compact-xs"
                            color="teal"
                            radius="md"
                            style={{ fontSize: 12 }}
                            onClick={() => {
                              setPaymentSupplier(s)
                              setPaymentModalOpen(true)
                            }}
                          >
                            Registrar Pago
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>

            <Paper withBorder radius="md" p="xs" px="md" bg="#f8fafc">
              <Flex justify="space-between" align="center">
                <Text size="xs" fw={500} c="#64748b">{suppliersWithDebt.length} proveedores con deuda</Text>
                <Text size="xs" fw={600} c="#1e293b">
                  Total Deuda: <Text span fw={700} c="#dc2626">{fmt(totalDebt)}</Text>
                </Text>
              </Flex>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Modals */}
      <PurchaseFormModal
        opened={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSaved={() => { setPurchaseModalOpen(false); fetchPurchases(); fetchAllSuppliers() }}
      />
      <SupplierFormModal
        opened={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        supplier={editingSupplier}
        onSaved={() => { setSupplierModalOpen(false); fetchSuppliers(); fetchAllSuppliers() }}
      />
      <SupplierPaymentModal
        opened={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        supplier={paymentSupplier}
        onSaved={() => { setPaymentModalOpen(false); fetchAllSuppliers(); if (activeTab === 'compras') fetchPurchases() }}
      />
    </Stack>
  )
}
