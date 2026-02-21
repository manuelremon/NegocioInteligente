import { useCallback, useEffect, useState } from 'react'
import { SimpleGrid, Paper, Stack, Text, Table, Center, Loader, Alert, Badge } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { InventoryValue } from '@renderer/types/ipc'

const fmt = (v: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)

interface StatCardProps {
  label: string
  value: string
  color?: string
}

function StatCard({ label, value, color }: StatCardProps): JSX.Element {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {label}
        </Text>
        <Text size="lg" fw={700} c={color}>
          {value}
        </Text>
      </Stack>
    </Paper>
  )
}

interface LowStockItem {
  id: number
  name: string
  categoryName?: string | null
  stock: number
  minStock: number
}

export default function InventoryReport(): JSX.Element {
  const [inventoryData, setInventoryData] = useState<InventoryValue | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [invResult, lowResult] = await Promise.all([
        window.api.reports.inventoryValue(),
        window.api.reports.lowStock()
      ])

      if (invResult.ok && invResult.data) {
        setInventoryData(invResult.data as InventoryValue)
      } else {
        setError(invResult.error ?? 'Error al cargar el valor de inventario')
        return
      }

      if (lowResult.ok && lowResult.data) {
        setLowStockProducts(lowResult.data as LowStockItem[])
      } else {
        setError(lowResult.error ?? 'Error al cargar productos con stock bajo')
      }
    } catch {
      setError('Error de conexion al cargar datos de inventario')
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar el reporte de inventario',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    )
  }

  return (
    <Stack gap="lg">
      {inventoryData && (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <StatCard
            label="Total Productos"
            value={String(inventoryData.totalProducts)}
            color="blue"
          />
          <StatCard
            label="Unidades en Stock"
            value={String(inventoryData.totalUnits)}
            color="teal"
          />
          <StatCard
            label="Valor al Costo"
            value={fmt(inventoryData.totalCostValue)}
            color="orange"
          />
          <StatCard
            label="Valor a Precio Venta"
            value={fmt(inventoryData.totalSaleValue)}
            color="green"
          />
        </SimpleGrid>
      )}

      <Paper withBorder p="md" radius="md">
        <Text fw={600} mb="md">
          Productos con Stock Bajo
        </Text>
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Categoria</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Stock Actual</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Stock Minimo</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Faltante</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lowStockProducts.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="md">
                      No hay productos con stock bajo
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                lowStockProducts.map((p) => {
                  const faltante = p.minStock - p.stock
                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td>
                        <Text fw={500}>{p.name}</Text>
                      </Table.Td>
                      <Table.Td>{p.categoryName ?? '-'}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text c={p.stock === 0 ? 'red' : 'orange'} fw={700}>
                          {p.stock}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>{p.minStock}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Badge color={faltante > 0 ? 'red' : 'green'} variant="light">
                          {faltante > 0 ? `${faltante}` : '0'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  )
                })
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Stack>
  )
}
