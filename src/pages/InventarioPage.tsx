import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Group,
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
    <Stack gap="md">
      {/* Page header */}
      <Group justify="space-between" align="center">
        <Title order={3} fw={700} c="#1e293b">Inventario</Title>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} variant="default" radius="md">
        <Tabs.List>
          <Tabs.Tab value="productos" fz={13} fw={600}>Productos</Tabs.Tab>
          <Tabs.Tab value="categorias" fz={13} fw={600}>Categorias</Tabs.Tab>
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
    </Stack>
  )
}
