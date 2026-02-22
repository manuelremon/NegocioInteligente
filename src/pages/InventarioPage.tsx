import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Loader,
  Center,
  Box,
  Flex,
  Checkbox,
  Tooltip
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import type { Product, Category } from '@renderer/types/ipc'
import { playBeep, parseScannerSettings, DEFAULT_SCANNER_SETTINGS } from '@renderer/utils/scanner'
import type { ScannerSettings } from '@renderer/utils/scanner'
import ProductFormModal from '@renderer/components/inventory/ProductFormModal'
import StockAdjustModal from '@renderer/components/inventory/StockAdjustModal'
import CategoryFormModal from '@renderer/components/inventory/CategoryFormModal'
import BarcodeScanner from '@renderer/components/pos/BarcodeScanner'

const fmt = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const IconBarcode = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" />
  </svg>
)

const IconCamera = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
)

interface RecepcionItem {
  product: Product
  quantity: number
}

export default function InventarioPage(): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<string | null>('productos')
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [showReponer, setShowReponer] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loadingLowStock, setLoadingLowStock] = useState(false)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)

  // Scanner state (shared for Productos tab scan bar)
  const [scannerSettings, setScannerSettings] = useState<ScannerSettings>(DEFAULT_SCANNER_SETTINGS)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanBarcode, setScanBarcode] = useState('')
  const scanInputRef = useRef<HTMLInputElement>(null)
  const lastScanInputTime = useRef<number>(0)
  const rapidScanCharCount = useRef<number>(0)
  const rapidScanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Scan results dropdown state
  const [scanResults, setScanResults] = useState<Product[]>([])
  const [showScanResults, setShowScanResults] = useState(false)
  const scanDropdownRef = useRef<HTMLDivElement>(null)

  // Recepcion tab state
  const [recepcionItems, setRecepcionItems] = useState<RecepcionItem[]>([])
  const [recScanBarcode, setRecScanBarcode] = useState('')
  const [recScannerOpen, setRecScannerOpen] = useState(false)
  const [confirmingRecepcion, setConfirmingRecepcion] = useState(false)
  const recScanInputRef = useRef<HTMLInputElement>(null)
  const lastRecScanInputTime = useRef<number>(0)
  const rapidRecScanCharCount = useRef<number>(0)
  const rapidRecScanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load scanner settings
  useEffect(() => {
    window.api.settings.getAll().then((res) => {
      if (res.ok && res.data) {
        setScannerSettings(parseScannerSettings(res.data as Record<string, string>))
      }
    })
  }, [])

  // Cleanup rapid-input timers on unmount
  useEffect(() => {
    return () => {
      if (rapidScanTimer.current) clearTimeout(rapidScanTimer.current)
      if (rapidRecScanTimer.current) clearTimeout(rapidRecScanTimer.current)
    }
  }, [])

  // Close scan dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (
        scanDropdownRef.current &&
        !scanDropdownRef.current.contains(e.target as Node) &&
        scanInputRef.current &&
        !scanInputRef.current.contains(e.target as Node)
      ) {
        setShowScanResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const res = await window.api.categories.list()
      if (res.ok && res.data) setCategories(res.data)
    } catch { /* ignore */ } finally { setLoadingCategories(false) }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const filters: Record<string, unknown> = {}
      if (debouncedSearch) filters.search = debouncedSearch
      if (categoryFilter) filters.categoryId = Number(categoryFilter)
      const res = await window.api.products.list(filters)
      if (res.ok && res.data) setProducts(res.data)
    } catch { /* ignore */ } finally { setLoadingProducts(false) }
  }, [debouncedSearch, categoryFilter])

  const fetchLowStock = useCallback(async () => {
    setLoadingLowStock(true)
    try {
      const res = await window.api.reports.lowStock()
      if (res.ok && res.data) setLowStockProducts(res.data)
    } catch { /* ignore */ } finally { setLoadingLowStock(false) }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { if (activeTab === 'productos') fetchProducts() }, [activeTab, fetchProducts])
  useEffect(() => { if (activeTab === 'stock-bajo') fetchLowStock() }, [activeTab, fetchLowStock])

  const categorySelectData = useMemo(
    () => [{ value: '', label: 'TODOS' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))],
    [categories]
  )

  const filteredProducts = useMemo(() => {
    if (!showReponer) return products
    return products.filter((p) => p.trackInventory && p.stock <= p.minStock)
  }, [products, showReponer])

  // Totals
  const totalCosto = filteredProducts.reduce((s, p) => s + p.costPrice * p.stock, 0)
  const totalVenta = filteredProducts.reduce((s, p) => s + p.basePrice * p.stock, 0)

  const handleToggleActive = async (product: Product): Promise<void> => {
    const res = await window.api.products.update({ id: product.id, isActive: !product.isActive })
    if (res.ok) {
      notifications.show({ title: 'OK', message: `${product.name} ${product.isActive ? 'desactivado' : 'activado'}`, color: 'green' })
      fetchProducts()
    }
  }

  const handleDeleteCategory = async (category: Category): Promise<void> => {
    if (!window.confirm(`Eliminar la categoria "${category.name}"?`)) return
    const res = await window.api.categories.remove(category.id)
    if (res.ok) {
      notifications.show({ title: 'OK', message: `"${category.name}" eliminada`, color: 'green' })
      fetchCategories()
    }
  }

  // ========== Scan bar logic for Productos tab ==========
  const executeScanSearch = useCallback(async (query: string) => {
    if (!query.trim()) return
    try {
      const result = await window.api.products.search(query.trim())
      if (result.ok && result.data) {
        const found = result.data as Product[]
        if (found.length === 0) {
          notifications.show({ title: 'No encontrado', message: `No se encontro producto: "${query.trim()}"`, color: 'yellow' })
          setScanResults([])
          setShowScanResults(false)
        } else if (found.length === 1) {
          if (scannerSettings.sound) playBeep()
          setScanBarcode('')
          setScanResults([])
          setShowScanResults(false)
          setStockProduct(found[0])
          setStockModalOpen(true)
        } else {
          if (scannerSettings.sound) playBeep()
          setScanResults(found)
          setShowScanResults(true)
        }
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error al buscar producto', color: 'red' })
    }
  }, [scannerSettings.sound])

  const handleScanInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.currentTarget.value
    setScanBarcode(value)

    if (scannerSettings.mode === 'camera') return

    const now = Date.now()
    const timeSinceLastInput = now - lastScanInputTime.current
    lastScanInputTime.current = now

    if (timeSinceLastInput < scannerSettings.rapidMs) {
      rapidScanCharCount.current++
    } else {
      rapidScanCharCount.current = 1
    }

    if (rapidScanCharCount.current >= 6) {
      if (rapidScanTimer.current) clearTimeout(rapidScanTimer.current)
      rapidScanTimer.current = setTimeout(() => {
        rapidScanCharCount.current = 0
        if (value.trim()) executeScanSearch(value)
      }, 80)
    }
  }

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (rapidScanTimer.current) {
        clearTimeout(rapidScanTimer.current)
        rapidScanTimer.current = null
      }
      rapidScanCharCount.current = 0
      executeScanSearch(scanBarcode)
    } else if (e.key === 'Escape') {
      setShowScanResults(false)
      setScanResults([])
    }
  }

  const handleScanCameraResult = useCallback((code: string) => {
    setScannerOpen(false)
    setScanBarcode(code)
    executeScanSearch(code)
  }, [executeScanSearch])

  const handleSelectScanResult = (product: Product): void => {
    setScanBarcode('')
    setScanResults([])
    setShowScanResults(false)
    setStockProduct(product)
    setStockModalOpen(true)
  }

  // ========== Recepcion tab logic ==========
  const executeRecScanSearch = useCallback(async (query: string) => {
    if (!query.trim()) return
    try {
      const result = await window.api.products.search(query.trim())
      if (result.ok && result.data) {
        const found = result.data as Product[]
        if (found.length === 0) {
          notifications.show({ title: 'No encontrado', message: `No se encontro producto: "${query.trim()}"`, color: 'yellow' })
        } else {
          if (scannerSettings.sound) playBeep()
          const product = found[0]
          setRecepcionItems((prev) => {
            const existing = prev.find((item) => item.product.id === product.id)
            if (existing) {
              return prev.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            }
            return [...prev, { product, quantity: 1 }]
          })
        }
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error al buscar producto', color: 'red' })
    }
    setRecScanBarcode('')
    recScanInputRef.current?.focus()
  }, [scannerSettings.sound])

  const handleRecScanInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.currentTarget.value
    setRecScanBarcode(value)

    if (scannerSettings.mode === 'camera') return

    const now = Date.now()
    const timeSinceLastInput = now - lastRecScanInputTime.current
    lastRecScanInputTime.current = now

    if (timeSinceLastInput < scannerSettings.rapidMs) {
      rapidRecScanCharCount.current++
    } else {
      rapidRecScanCharCount.current = 1
    }

    if (rapidRecScanCharCount.current >= 6) {
      if (rapidRecScanTimer.current) clearTimeout(rapidRecScanTimer.current)
      rapidRecScanTimer.current = setTimeout(() => {
        rapidRecScanCharCount.current = 0
        if (value.trim()) executeRecScanSearch(value)
      }, 80)
    }
  }

  const handleRecScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (rapidRecScanTimer.current) {
        clearTimeout(rapidRecScanTimer.current)
        rapidRecScanTimer.current = null
      }
      rapidRecScanCharCount.current = 0
      executeRecScanSearch(recScanBarcode)
    }
  }

  const handleRecCameraResult = useCallback((code: string) => {
    setRecScannerOpen(false)
    setRecScanBarcode(code)
    executeRecScanSearch(code)
  }, [executeRecScanSearch])

  const handleRecepcionQtyChange = (productId: number, value: number | string): void => {
    const qty = typeof value === 'number' ? value : 0
    if (qty <= 0) return
    setRecepcionItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    )
  }

  const handleRemoveRecepcionItem = (productId: number): void => {
    setRecepcionItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleConfirmRecepcion = async (): Promise<void> => {
    if (recepcionItems.length === 0) return
    setConfirmingRecepcion(true)
    let successCount = 0
    let errorCount = 0

    for (const item of recepcionItems) {
      try {
        const res = await window.api.products.adjustStock({
          id: item.product.id,
          adjustment: item.quantity
        })
        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    setConfirmingRecepcion(false)

    if (errorCount === 0) {
      notifications.show({
        title: 'Recepcion confirmada',
        message: `Se ajusto el stock de ${successCount} producto${successCount !== 1 ? 's' : ''} correctamente`,
        color: 'green'
      })
      setRecepcionItems([])
      fetchProducts()
    } else {
      notifications.show({
        title: 'Recepcion parcial',
        message: `${successCount} exitosos, ${errorCount} con error`,
        color: 'orange'
      })
      fetchProducts()
    }
  }

  const recepcionTotalProducts = recepcionItems.length
  const recepcionTotalUnits = recepcionItems.reduce((s, item) => s + item.quantity, 0)

  const showCameraButton = scannerSettings.mode !== 'usb'
  const showUsbIndicator = scannerSettings.mode !== 'camera'

  return (
    <Stack gap="md">
      {/* Page header */}
      <Group justify="space-between" align="center">
        <Title order={3} fw={700} c="#1e293b">Inventario</Title>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} variant="default" radius="md">
        <Tabs.List>
          <Tabs.Tab value="productos" fz={13} fw={600}>Productos</Tabs.Tab>
          <Tabs.Tab value="categorias" fz={13} fw={600}>Categorias</Tabs.Tab>
          <Tabs.Tab value="recepcion" fz={13} fw={600}>Recepcion</Tabs.Tab>
          <Tabs.Tab
            value="stock-bajo"
            fz={13}
            fw={600}
            rightSection={
              lowStockProducts.length > 0
                ? <Badge size="xs" color="red" variant="filled" radius="xl">{lowStockProducts.length}</Badge>
                : undefined
            }
          >
            Stock Bajo
          </Tabs.Tab>
        </Tabs.List>

        {/* ============ TAB: PRODUCTOS ============ */}
        <Tabs.Panel value="productos" pt="md">
          <Stack gap="sm">
            {/* Scan bar */}
            <Paper withBorder radius="md" p="sm" bg="#f0f4ff" style={{ borderColor: '#c7d2fe' }}>
              <Flex gap="sm" align="center">
                {showUsbIndicator && (
                  <Tooltip label="Lector USB listo — escanea un codigo para ajustar stock" position="bottom" withArrow>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#6366f1', opacity: 0.7, flexShrink: 0 }}>
                      <IconBarcode />
                    </div>
                  </Tooltip>
                )}
                <div style={{ flex: 1, position: 'relative' }}>
                  <TextInput
                    ref={scanInputRef}
                    placeholder="Escanear codigo de barras para ajustar stock... [Enter]"
                    value={scanBarcode}
                    onChange={handleScanInputChange}
                    onKeyDown={handleScanKeyDown}
                    onFocus={() => { if (scanResults.length > 0) setShowScanResults(true) }}
                    size="sm"
                    radius="md"
                    styles={{
                      input: {
                        fontWeight: 500,
                        border: '1.5px solid #c7d2fe',
                        '&:focus': { borderColor: '#6366f1' }
                      }
                    }}
                  />
                  {/* Scan results dropdown */}
                  {showScanResults && scanResults.length > 0 && (
                    <Paper
                      ref={scanDropdownRef}
                      shadow="lg"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: 240,
                        overflowY: 'auto',
                        zIndex: 1000,
                        border: '1px solid #e2e8f0',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px'
                      }}
                    >
                      <Text fz={11} fw={600} c="#64748b" px="sm" py={4} bg="#f8fafc">
                        Multiples resultados — selecciona uno:
                      </Text>
                      {scanResults.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleSelectScanResult(product)}
                          style={{
                            padding: '8px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            background: '#fff',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: 13,
                            transition: 'background 60ms ease'
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#eef2ff' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                        >
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", minWidth: 75, flexShrink: 0 }}>
                              {product.barcode || product.sku || `ID:${product.id}`}
                            </span>
                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1e293b' }}>
                              {product.name}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, flexShrink: 0, marginLeft: 10 }}>
                            Stk: {product.stock}
                          </span>
                        </div>
                      ))}
                    </Paper>
                  )}
                </div>
                {showCameraButton && (
                  <Tooltip label="Escanear con camara" position="bottom" withArrow>
                    <ActionIcon
                      variant="light"
                      color="indigo"
                      size="lg"
                      onClick={() => setScannerOpen(true)}
                      aria-label="Abrir escaner de camara"
                    >
                      <IconCamera />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Flex>
            </Paper>

            {/* Filters row */}
            <Paper withBorder radius="md" p="sm" bg="white" style={{ borderColor: '#e2e8f0' }}>
              <Flex gap="md" align="center" wrap="wrap">
                <Group gap={6}>
                  <Text fz={13} fw={500} c="#64748b">Buscar:</Text>
                  <TextInput
                    placeholder="Nombre, codigo o SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    size="sm"
                    radius="md"
                    style={{ width: 240 }}
                  />
                </Group>
                <Group gap={6}>
                  <Text fz={13} fw={500} c="#64748b">Categoria:</Text>
                  <Select
                    data={categorySelectData}
                    value={categoryFilter ?? ''}
                    onChange={(v) => setCategoryFilter(v === '' ? null : v)}
                    size="sm"
                    radius="md"
                    style={{ width: 180 }}
                  />
                </Group>
                <Checkbox
                  label="Para Reponer"
                  checked={showReponer}
                  onChange={(e) => setShowReponer(e.currentTarget.checked)}
                  size="sm"
                  styles={{ label: { fontSize: 13, color: '#1e293b' } }}
                />
                <Box style={{ flex: 1 }} />
                <Group gap="lg">
                  <Group gap={4}>
                    <Text fz="xs" fw={600} c="#64748b">Total Costo:</Text>
                    <Text fz="xs" fw={700} c="#4f46e5">{fmt(totalCosto)}</Text>
                  </Group>
                  <Group gap={4}>
                    <Text fz="xs" fw={600} c="#64748b">Total Venta:</Text>
                    <Text fz="xs" fw={700} c="green.7">{fmt(totalVenta)}</Text>
                  </Group>
                </Group>
                <Button
                  size="sm"
                  radius="md"
                  color="#4f46e5"
                  onClick={() => { setEditingProduct(undefined); setProductModalOpen(true) }}
                >
                  Nuevo Producto
                </Button>
              </Flex>
            </Paper>

            {loadingProducts ? (
              <Center py="xl"><Loader size="sm" color="#4f46e5" /></Center>
            ) : (
              <Paper withBorder radius="md" style={{ borderColor: '#e2e8f0', overflow: 'hidden' }}>
                <Table.ScrollContainer minWidth={1100}>
                  <Table striped highlightOnHover verticalSpacing={6} horizontalSpacing="sm" fz={13}>
                    <Table.Thead>
                      <Table.Tr style={{ background: '#f8fafc' }}>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Codigo</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Detalle</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Categoria</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Stock</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Stock Min</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Reponer</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Precio Costo</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Total Costo</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Precio Venta</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Total Venta</Table.Th>
                        <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredProducts.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={11}>
                            <Text ta="center" c="#64748b" py="lg" fz={13}>No se encontraron productos</Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const reponer = p.trackInventory ? Math.max(0, p.minStock - p.stock) : 0
                          const isSelected = selectedRow === p.id
                          return (
                            <Table.Tr
                              key={p.id}
                              onClick={() => setSelectedRow(p.id)}
                              style={{
                                cursor: 'pointer',
                                background: isSelected ? '#eef2ff' : undefined
                              }}
                            >
                              <Table.Td style={{ whiteSpace: 'nowrap', color: '#1e293b' }}>{p.barcode || p.sku || '-'}</Table.Td>
                              <Table.Td>
                                <Text fz={13} fw={500} c="#1e293b" lineClamp={1}>{p.name}</Text>
                              </Table.Td>
                              <Table.Td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{p.categoryName ?? '-'}</Table.Td>
                              <Table.Td style={{
                                textAlign: 'right',
                                whiteSpace: 'nowrap',
                                color: p.stock <= p.minStock ? '#dc2626' : '#1e293b',
                                fontWeight: p.stock <= p.minStock ? 700 : 500
                              }}>
                                {p.trackInventory ? p.stock : 'N/A'}
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#64748b' }}>{p.trackInventory ? p.minStock : '-'}</Table.Td>
                              <Table.Td style={{
                                textAlign: 'right',
                                whiteSpace: 'nowrap',
                                color: reponer > 0 ? '#dc2626' : '#64748b',
                                fontWeight: reponer > 0 ? 700 : 400
                              }}>
                                {reponer > 0 ? reponer : 0}
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#1e293b' }}>{fmt(p.costPrice)}</Table.Td>
                              <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#1e293b' }}>{fmt(p.costPrice * p.stock)}</Table.Td>
                              <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#1e293b' }}>{fmt(p.basePrice)}</Table.Td>
                              <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#1e293b' }}>{fmt(p.basePrice * p.stock)}</Table.Td>
                              <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                <Group gap={4} wrap="nowrap">
                                  <Button variant="subtle" size="compact-xs" color="#4f46e5" fz={12}
                                    onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setProductModalOpen(true) }}>
                                    Editar
                                  </Button>
                                  {p.trackInventory && (
                                    <Button variant="subtle" size="compact-xs" color="teal" fz={12}
                                      onClick={(e) => { e.stopPropagation(); setStockProduct(p); setStockModalOpen(true) }}>
                                      Stock
                                    </Button>
                                  )}
                                  <Button variant="subtle" size="compact-xs"
                                    color={p.isActive ? 'red' : 'green'}
                                    fz={12}
                                    onClick={(e) => { e.stopPropagation(); handleToggleActive(p) }}>
                                    {p.isActive ? 'Des.' : 'Act.'}
                                  </Button>
                                </Group>
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

            {/* Status bar */}
            <Paper radius="md" p="xs" px="md" bg="#f8fafc" style={{ border: '1px solid #e2e8f0' }}>
              <Flex justify="space-between" align="center">
                <Text fz="xs" fw={600} c="#64748b">{filteredProducts.length} Resultados</Text>
                <Group gap="lg">
                  <Text fz="xs" fw={500} c="#64748b">Total Costo: <Text span c="#4f46e5" fw={700}>{fmt(totalCosto)}</Text></Text>
                  <Text fz="xs" fw={500} c="#64748b">Total Venta: <Text span c="green.7" fw={700}>{fmt(totalVenta)}</Text></Text>
                </Group>
              </Flex>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* ============ TAB: CATEGORIAS ============ */}
        <Tabs.Panel value="categorias" pt="md">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fz={15} fw={700} c="#1e293b">Categorias</Text>
              <Button
                size="sm"
                radius="md"
                color="#4f46e5"
                onClick={() => { setEditingCategory(undefined); setCategoryModalOpen(true) }}
              >
                Nueva Categoria
              </Button>
            </Group>

            {loadingCategories ? (
              <Center py="xl"><Loader size="sm" color="#4f46e5" /></Center>
            ) : (
              <Paper withBorder radius="md" style={{ borderColor: '#e2e8f0', overflow: 'hidden' }}>
                <Table striped highlightOnHover verticalSpacing={8} horizontalSpacing="md" fz={13}>
                  <Table.Thead>
                    <Table.Tr style={{ background: '#f8fafc' }}>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Nombre</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Color</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {categories.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={3}>
                          <Text ta="center" c="#64748b" py="lg" fz={13}>No hay categorias</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      categories.map((cat) => (
                        <Table.Tr key={cat.id}>
                          <Table.Td style={{ color: '#1e293b', fontWeight: 500 }}>{cat.name}</Table.Td>
                          <Table.Td>
                            {cat.color ? (
                              <Group gap={6}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: cat.color, border: '1px solid #e2e8f0' }} />
                                <Text fz="xs" c="#64748b">{cat.color}</Text>
                              </Group>
                            ) : <Text fz="xs" c="#64748b">-</Text>}
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <Button variant="subtle" size="compact-xs" color="#4f46e5" fz={12}
                                onClick={() => { setEditingCategory(cat); setCategoryModalOpen(true) }}>Editar</Button>
                              <Button variant="subtle" size="compact-xs" color="red" fz={12}
                                onClick={() => handleDeleteCategory(cat)}>Eliminar</Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        {/* ============ TAB: RECEPCION ============ */}
        <Tabs.Panel value="recepcion" pt="md">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fz={15} fw={700} c="#1e293b">Recepcion de Mercaderia</Text>
            </Group>

            {/* Scan bar for Recepcion */}
            <Paper withBorder radius="md" p="sm" bg="#f0fdf4" style={{ borderColor: '#86efac' }}>
              <Flex gap="sm" align="center">
                {showUsbIndicator && (
                  <Tooltip label="Lector USB listo — escanea productos para agregarlos a la lista" position="bottom" withArrow>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#16a34a', opacity: 0.7, flexShrink: 0 }}>
                      <IconBarcode />
                    </div>
                  </Tooltip>
                )}
                <TextInput
                  ref={recScanInputRef}
                  placeholder="Escanear codigo de barras para agregar a recepcion... [Enter]"
                  value={recScanBarcode}
                  onChange={handleRecScanInputChange}
                  onKeyDown={handleRecScanKeyDown}
                  size="sm"
                  radius="md"
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      fontWeight: 500,
                      border: '1.5px solid #86efac',
                      '&:focus': { borderColor: '#16a34a' }
                    }
                  }}
                />
                {showCameraButton && (
                  <Tooltip label="Escanear con camara" position="bottom" withArrow>
                    <ActionIcon
                      variant="light"
                      color="green"
                      size="lg"
                      onClick={() => setRecScannerOpen(true)}
                      aria-label="Abrir escaner de camara"
                    >
                      <IconCamera />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Flex>
            </Paper>

            {/* Recepcion items table */}
            <Paper withBorder radius="md" style={{ borderColor: '#e2e8f0', overflow: 'hidden' }}>
              <Table striped highlightOnHover verticalSpacing={6} horizontalSpacing="sm" fz={13}>
                <Table.Thead>
                  <Table.Tr style={{ background: '#f8fafc' }}>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Codigo</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Producto</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'center', width: 120 }}>Cant. a agregar</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Stock actual</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Stock resultante</Table.Th>
                    <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'center', width: 80 }}>Eliminar</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recepcionItems.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text ta="center" c="#64748b" py="xl" fz={13}>
                          Escanea productos con la pistola o camara para agregarlos a la lista
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    recepcionItems.map((item) => (
                      <Table.Tr key={item.product.id}>
                        <Table.Td style={{ whiteSpace: 'nowrap', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                          {item.product.barcode || item.product.sku || `ID:${item.product.id}`}
                        </Table.Td>
                        <Table.Td>
                          <Text fz={13} fw={500} c="#1e293b" lineClamp={1}>{item.product.name}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <NumberInput
                            value={item.quantity}
                            onChange={(v) => handleRecepcionQtyChange(item.product.id, v)}
                            min={1}
                            size="xs"
                            style={{ width: 80, margin: '0 auto' }}
                            styles={{ input: { textAlign: 'center', fontWeight: 600 } }}
                          />
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#64748b' }}>
                          {item.product.stock}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#16a34a', fontWeight: 700 }}>
                          {item.product.stock + item.quantity}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            color="red"
                            fz={12}
                            onClick={() => handleRemoveRecepcionItem(item.product.id)}
                          >
                            Quitar
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>

            {/* Footer with totals and actions */}
            <Paper radius="md" p="sm" px="md" bg="#f8fafc" style={{ border: '1px solid #e2e8f0' }}>
              <Flex justify="space-between" align="center">
                <Group gap="lg">
                  <Text fz="xs" fw={600} c="#64748b">
                    {recepcionTotalProducts} producto{recepcionTotalProducts !== 1 ? 's' : ''}
                  </Text>
                  <Text fz="xs" fw={600} c="#64748b">
                    {recepcionTotalUnits} unidad{recepcionTotalUnits !== 1 ? 'es' : ''} total{recepcionTotalUnits !== 1 ? 'es' : ''}
                  </Text>
                </Group>
                <Group gap="sm">
                  <Button
                    variant="default"
                    size="sm"
                    radius="md"
                    disabled={recepcionItems.length === 0 || confirmingRecepcion}
                    onClick={() => setRecepcionItems([])}
                  >
                    Limpiar
                  </Button>
                  <Button
                    color="green"
                    size="sm"
                    radius="md"
                    disabled={recepcionItems.length === 0}
                    loading={confirmingRecepcion}
                    onClick={handleConfirmRecepcion}
                  >
                    Confirmar Recepcion
                  </Button>
                </Group>
              </Flex>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* ============ TAB: STOCK BAJO ============ */}
        <Tabs.Panel value="stock-bajo" pt="md">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fz={15} fw={700} c="#1e293b">Productos con Stock Bajo</Text>
              <Button size="sm" radius="md" variant="light" color="#4f46e5" onClick={fetchLowStock}>
                Actualizar
              </Button>
            </Group>

            {loadingLowStock ? (
              <Center py="xl"><Loader size="sm" color="#4f46e5" /></Center>
            ) : (
              <Paper withBorder radius="md" style={{ borderColor: '#e2e8f0', overflow: 'hidden' }}>
                <Table striped highlightOnHover verticalSpacing={6} horizontalSpacing="sm" fz={13}>
                  <Table.Thead>
                    <Table.Tr style={{ background: '#f8fafc' }}>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Nombre</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Categoria</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Stock Actual</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Stock Minimo</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', textAlign: 'right' }}>Reponer</Table.Th>
                      <Table.Th style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Urgencia</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {lowStockProducts.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text ta="center" c="#64748b" py="lg" fz={13}>No hay productos con stock bajo</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      lowStockProducts.map((p) => {
                        const reponer = Math.max(0, p.minStock - p.stock)
                        return (
                          <Table.Tr key={p.id}>
                            <Table.Td style={{ color: '#1e293b', fontWeight: 500 }}>{p.name}</Table.Td>
                            <Table.Td style={{ color: '#64748b' }}>{p.categoryName ?? '-'}</Table.Td>
                            <Table.Td style={{ textAlign: 'right', color: p.stock === 0 ? '#dc2626' : '#1e293b', fontWeight: 700 }}>{p.stock}</Table.Td>
                            <Table.Td style={{ textAlign: 'right', color: '#64748b' }}>{p.minStock}</Table.Td>
                            <Table.Td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>{reponer}</Table.Td>
                            <Table.Td>
                              {p.stock === 0 ? <Badge size="sm" color="red" variant="filled" radius="md">Sin stock</Badge>
                                : reponer > 0 ? <Badge size="sm" color="red" variant="light" radius="md">Critico</Badge>
                                  : <Badge size="sm" color="orange" variant="light" radius="md">Bajo</Badge>}
                            </Table.Td>
                          </Table.Tr>
                        )
                      })
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            {/* Status bar */}
            <Paper radius="md" p="xs" px="md" bg="#f8fafc" style={{ border: '1px solid #e2e8f0' }}>
              <Text fz="xs" fw={600} c="#64748b">{lowStockProducts.length} Resultados</Text>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <ProductFormModal
        opened={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={editingProduct}
        onSaved={() => { setProductModalOpen(false); fetchProducts() }}
      />
      <StockAdjustModal
        opened={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        product={stockProduct}
        onSaved={() => { setStockModalOpen(false); fetchProducts(); if (activeTab === 'stock-bajo') fetchLowStock() }}
      />
      <CategoryFormModal
        opened={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        category={editingCategory}
        onSaved={() => { setCategoryModalOpen(false); fetchCategories() }}
      />
      <BarcodeScanner
        opened={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanCameraResult}
        preferredCameraId={scannerSettings.cameraId || undefined}
      />
      <BarcodeScanner
        opened={recScannerOpen}
        onClose={() => setRecScannerOpen(false)}
        onScan={handleRecCameraResult}
        preferredCameraId={scannerSettings.cameraId || undefined}
      />
    </Stack>
  )
}
