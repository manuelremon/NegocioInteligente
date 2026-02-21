import { useCallback, useEffect, useState } from 'react'
import { Stack, Table, Text, Center, Loader, Alert, Paper } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import type { TopProduct } from '@renderer/types/ipc'

const fmt = (v: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)

interface TopProductsReportProps {
  from: string
  to: string
}

export default function TopProductsReport({ from, to }: TopProductsReportProps): JSX.Element {
  const [products, setProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.reports.topProducts({ from, to })
      if (result.ok && result.data) {
        setProducts(result.data as TopProduct[])
      } else {
        setError(result.error ?? 'Error al cargar los productos mas vendidos')
      }
    } catch {
      setError('Error de conexion al cargar productos mas vendidos')
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar el reporte de productos',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }, [from, to])

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

  if (products.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No hay datos de productos en el periodo seleccionado
      </Text>
    )
  }

  return (
    <Stack gap="lg">
      <Paper withBorder p="md" radius="md">
        <Text fw={600} mb="md">
          Top 10 Productos por Cantidad
        </Text>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={products}
            layout="vertical"
            margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="productName"
              tick={{ fontSize: 12 }}
              width={150}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Cantidad']}
            />
            <Bar dataKey="totalQuantity" fill="#40c057" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Table.ScrollContainer minWidth={600}>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 60, textAlign: 'center' }}>#</Table.Th>
              <Table.Th>Producto</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Cantidad Vendida</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Ingresos Totales</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {products.map((p, index) => (
              <Table.Tr key={p.productId}>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Text fw={700} c={index < 3 ? 'blue' : undefined}>
                    {index + 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={500}>{p.productName}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text fw={600}>{p.totalQuantity}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text fw={600}>{fmt(p.totalRevenue)}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  )
}
