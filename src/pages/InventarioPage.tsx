import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Tooltip,
  Loader,
  Center,
  Box,
  Flex,
  Checkbox
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import type { Product, Category } from '@renderer/types/ipc'
import ProductFormModal from '@renderer/components/inventory/ProductFormModal'
import StockAdjustModal from '@renderer/components/inventory/StockAdjustModal'
import CategoryFormModal from '@renderer/components/inventory/CategoryFormModal'

const fmt = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const cellStyle: React.CSSProperties = { fontSize: 12, padding: '3px 6px', whiteSpace: 'nowrap' }
const cellRight: React.CSSProperties = { ...cellStyle, textAlign: 'right' }
const thStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '4px 6px',
  fontWeight: 700,
  background: 'linear-gradient(180deg, #f0f2f5 0%, #dcdfe4 100%)',
  whiteSpace: 'nowrap',
  userSelect: 'none'
}
const thRight: React.CSSProperties = { ...thStyle, textAlign: 'right' }

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

  return (
    <Stack gap={6}>
      {/* Compact title bar */}
      <Box
        style={{
          background: 'linear-gradient(180deg, #1a2744 0%, #0f1b33 100%)',
          padding: '4px 12px',
          borderRadius: 4
        }}
      >
        <Text size="sm" fw={700} c="white">Consulta de Stock de Articulos</Text>
      </Box>

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
        <Tabs.List>
          <Tabs.Tab value="productos" style={{ fontSize: 12, fontWeight: 600 }}>Productos</Tabs.Tab>
          <Tabs.Tab value="categorias" style={{ fontSize: 12, fontWeight: 600 }}>Categorias</Tabs.Tab>
          <Tabs.Tab value="stock-bajo" style={{ fontSize: 12, fontWeight: 600 }}>
            Stock Bajo
            {lowStockProducts.length > 0 && (
              <Badge size="xs" color="red" ml={4}>{lowStockProducts.length}</Badge>
            )}
          </Tabs.Tab>
        </Tabs.List>

        {/* ============ TAB: PRODUCTOS ============ */}
        <Tabs.Panel value="productos" pt={6}>
          <Stack gap={6}>
            {/* Filters row - like VP Sistemas style */}
            <Box style={{ border: '1px solid #c0c4cc', borderRadius: 3, padding: '6px 8px', background: '#f8f9fa' }}>
              <Flex gap={8} align="center" wrap="wrap">
                <Group gap={4}>
                  <Text size="xs" fw={600}>Buscar:</Text>
                  <TextInput
                    placeholder="Nombre, codigo o SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    size="xs"
                    style={{ width: 220 }}
                  />
                </Group>
                <Group gap={4}>
                  <Text size="xs" fw={600}>Categoria:</Text>
                  <Select
                    data={categorySelectData}
                    value={categoryFilter ?? ''}
                    onChange={(v) => setCategoryFilter(v === '' ? null : v)}
                    size="xs"
                    style={{ width: 160 }}
                  />
                </Group>
                <Checkbox
                  label="Para Reponer"
                  checked={showReponer}
                  onChange={(e) => setShowReponer(e.currentTarget.checked)}
                  size="xs"
                />
                <Box style={{ flex: 1 }} />
                <Group gap={4}>
                  <Text size="xs" fw={700}>Total Costo:</Text>
                  <Text size="xs" fw={700} c="blue.8">{fmt(totalCosto)}</Text>
                </Group>
                <Group gap={4}>
                  <Text size="xs" fw={700}>Total Venta:</Text>
                  <Text size="xs" fw={700} c="green.8">{fmt(totalVenta)}</Text>
                </Group>
                <Button size="xs" variant="default" onClick={() => { setEditingProduct(undefined); setProductModalOpen(true) }}>
                  Nuevo
                </Button>
              </Flex>
            </Box>

            {loadingProducts ? (
              <Center py="xl"><Loader size="sm" /></Center>
            ) : (
              <Table.ScrollContainer minWidth={1100}>
                <Table striped highlightOnHover withTableBorder withColumnBorders style={{ fontSize: 12 }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={thStyle}>Codigo</Table.Th>
                      <Table.Th style={thStyle}>Detalle</Table.Th>
                      <Table.Th style={thStyle}>Categoria</Table.Th>
                      <Table.Th style={thRight}>Stock</Table.Th>
                      <Table.Th style={thRight}>Stock Min</Table.Th>
                      <Table.Th style={thRight}>Reponer</Table.Th>
                      <Table.Th style={thRight}>Precio Costo</Table.Th>
                      <Table.Th style={thRight}>Total Costo</Table.Th>
                      <Table.Th style={thRight}>Precio Venta</Table.Th>
                      <Table.Th style={thRight}>Total Venta</Table.Th>
                      <Table.Th style={thStyle}>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredProducts.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={11} style={cellStyle}>
                          <Text ta="center" c="dimmed" py="sm" size="xs">No se encontraron productos</Text>
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
                              background: isSelected ? '#cce5ff' : undefined
                            }}
                          >
                            <Table.Td style={cellStyle}>{p.barcode || p.sku || '-'}</Table.Td>
                            <Table.Td style={cellStyle}>
                              <Text size="xs" fw={500} lineClamp={1}>{p.name}</Text>
                            </Table.Td>
                            <Table.Td style={cellStyle}>{p.categoryName ?? '-'}</Table.Td>
                            <Table.Td style={{
                              ...cellRight,
                              color: p.stock <= p.minStock ? '#dc2626' : undefined,
                              fontWeight: p.stock <= p.minStock ? 700 : undefined
                            }}>
                              {p.trackInventory ? p.stock : 'N/A'}
                            </Table.Td>
                            <Table.Td style={cellRight}>{p.trackInventory ? p.minStock : '-'}</Table.Td>
                            <Table.Td style={{
                              ...cellRight,
                              color: reponer > 0 ? '#dc2626' : undefined,
                              fontWeight: reponer > 0 ? 700 : undefined
                            }}>
                              {reponer > 0 ? reponer : 0}
                            </Table.Td>
                            <Table.Td style={cellRight}>{fmt(p.costPrice)}</Table.Td>
                            <Table.Td style={cellRight}>{fmt(p.costPrice * p.stock)}</Table.Td>
                            <Table.Td style={cellRight}>{fmt(p.basePrice)}</Table.Td>
                            <Table.Td style={cellRight}>{fmt(p.basePrice * p.stock)}</Table.Td>
                            <Table.Td style={cellStyle}>
                              <Group gap={2} wrap="nowrap">
                                <Button variant="subtle" size="compact-xs" style={{ fontSize: 11 }}
                                  onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setProductModalOpen(true) }}>
                                  Editar
                                </Button>
                                {p.trackInventory && (
                                  <Button variant="subtle" size="compact-xs" color="teal" style={{ fontSize: 11 }}
                                    onClick={(e) => { e.stopPropagation(); setStockProduct(p); setStockModalOpen(true) }}>
                                    Stock
                                  </Button>
                                )}
                                <Button variant="subtle" size="compact-xs"
                                  color={p.isActive ? 'red' : 'green'}
                                  style={{ fontSize: 11 }}
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
            )}

            {/* Status bar - result count */}
            <Box style={{
              background: 'linear-gradient(180deg, #e2e4e8 0%, #cdd0d6 100%)',
              border: '1px solid #b0b5be',
              borderRadius: 3,
              padding: '3px 10px'
            }}>
              <Flex justify="space-between" align="center">
                <Text size="xs" fw={600}>{filteredProducts.length} Resultados</Text>
                <Group gap={16}>
                  <Text size="xs" fw={600}>Total Costo: <Text span c="blue.8" fw={700}>{fmt(totalCosto)}</Text></Text>
                  <Text size="xs" fw={600}>Total Venta: <Text span c="green.8" fw={700}>{fmt(totalVenta)}</Text></Text>
                </Group>
              </Flex>
            </Box>
          </Stack>
        </Tabs.Panel>

        {/* ============ TAB: CATEGORIAS ============ */}
        <Tabs.Panel value="categorias" pt={6}>
          <Stack gap={6}>
            <Group justify="space-between">
              <Text size="sm" fw={700}>Categorias</Text>
              <Button size="xs" variant="default" onClick={() => { setEditingCategory(undefined); setCategoryModalOpen(true) }}>
                Nueva Categoria
              </Button>
            </Group>

            {loadingCategories ? (
              <Center py="xl"><Loader size="sm" /></Center>
            ) : (
              <Table striped highlightOnHover withTableBorder withColumnBorders style={{ fontSize: 12 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={thStyle}>Nombre</Table.Th>
                    <Table.Th style={thStyle}>Color</Table.Th>
                    <Table.Th style={thStyle}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {categories.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={3} style={cellStyle}>
                        <Text ta="center" c="dimmed" size="xs">No hay categorias</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    categories.map((cat) => (
                      <Table.Tr key={cat.id}>
                        <Table.Td style={cellStyle}>{cat.name}</Table.Td>
                        <Table.Td style={cellStyle}>
                          {cat.color ? (
                            <Group gap={4}>
                              <div style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: cat.color, border: '1px solid #ccc' }} />
                              <Text size="xs" c="dimmed">{cat.color}</Text>
                            </Group>
                          ) : '-'}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          <Group gap={2}>
                            <Button variant="subtle" size="compact-xs" style={{ fontSize: 11 }}
                              onClick={() => { setEditingCategory(cat); setCategoryModalOpen(true) }}>Editar</Button>
                            <Button variant="subtle" size="compact-xs" color="red" style={{ fontSize: 11 }}
                              onClick={() => handleDeleteCategory(cat)}>Eliminar</Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Tabs.Panel>

        {/* ============ TAB: STOCK BAJO ============ */}
        <Tabs.Panel value="stock-bajo" pt={6}>
          <Stack gap={6}>
            <Group justify="space-between">
              <Text size="sm" fw={700}>Productos con Stock Bajo</Text>
              <Button size="xs" variant="default" onClick={fetchLowStock}>Actualizar</Button>
            </Group>

            {loadingLowStock ? (
              <Center py="xl"><Loader size="sm" /></Center>
            ) : (
              <Table striped highlightOnHover withTableBorder withColumnBorders style={{ fontSize: 12 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={thStyle}>Nombre</Table.Th>
                    <Table.Th style={thStyle}>Categoria</Table.Th>
                    <Table.Th style={thRight}>Stock Actual</Table.Th>
                    <Table.Th style={thRight}>Stock Minimo</Table.Th>
                    <Table.Th style={thRight}>Reponer</Table.Th>
                    <Table.Th style={thStyle}>Urgencia</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {lowStockProducts.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} style={cellStyle}>
                        <Text ta="center" c="dimmed" size="xs">No hay productos con stock bajo</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    lowStockProducts.map((p) => {
                      const reponer = Math.max(0, p.minStock - p.stock)
                      return (
                        <Table.Tr key={p.id}>
                          <Table.Td style={cellStyle}>{p.name}</Table.Td>
                          <Table.Td style={cellStyle}>{p.categoryName ?? '-'}</Table.Td>
                          <Table.Td style={{ ...cellRight, color: p.stock === 0 ? '#dc2626' : undefined, fontWeight: 700 }}>{p.stock}</Table.Td>
                          <Table.Td style={cellRight}>{p.minStock}</Table.Td>
                          <Table.Td style={{ ...cellRight, color: '#dc2626', fontWeight: 700 }}>{reponer}</Table.Td>
                          <Table.Td style={cellStyle}>
                            {p.stock === 0 ? <Badge size="xs" color="red" variant="filled">Sin stock</Badge>
                              : reponer > 0 ? <Badge size="xs" color="red">Critico</Badge>
                                : <Badge size="xs" color="orange">Bajo</Badge>}
                          </Table.Td>
                        </Table.Tr>
                      )
                    })
                  )}
                </Table.Tbody>
              </Table>
            )}

            <Box style={{ background: '#e2e4e8', border: '1px solid #b0b5be', borderRadius: 3, padding: '3px 10px' }}>
              <Text size="xs" fw={600}>{lowStockProducts.length} Resultados</Text>
            </Box>
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
    </Stack>
  )
}
