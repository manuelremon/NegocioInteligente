import { useCallback, useEffect, useState } from 'react'
import { SimpleGrid, Paper, Stack, Text, Center, Loader, Alert } from '@mantine/core'
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
import type { SalesSummary } from '@renderer/types/ipc'

const fmt = (v: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)

interface SalesReportProps {
  from: string
  to: string
}

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

export default function SalesReport({ from, to }: SalesReportProps): JSX.Element {
  const [data, setData] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.reports.salesSummary({ from, to })
      if (result.ok && result.data) {
        setData(result.data as SalesSummary)
      } else {
        setError(result.error ?? 'Error al cargar el resumen de ventas')
      }
    } catch {
      setError('Error de conexion al cargar el resumen de ventas')
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar el reporte de ventas',
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

  if (!data) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No hay datos disponibles
      </Text>
    )
  }

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatCard label="Total Vendido" value={fmt(data.totalSales)} color="green" />
        <StatCard label="Transacciones" value={String(data.totalTransactions)} color="blue" />
        <StatCard label="Ticket Promedio" value={fmt(data.averageTicket)} color="violet" />
      </SimpleGrid>

      <Paper withBorder p="md" radius="md">
        <Text fw={600} mb="md">
          Ventas Diarias
        </Text>
        {data.dailyData.length === 0 ? (
          <Text c="dimmed" ta="center" py="lg">
            No hay ventas en el periodo seleccionado
          </Text>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: string) => {
                  const parts = value.split('-')
                  return `${parts[2]}/${parts[1]}`
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => fmt(value)}
              />
              <Tooltip
                formatter={(value: number) => [fmt(value), 'Total']}
                labelFormatter={(label: string) => {
                  const parts = label.split('-')
                  return `${parts[2]}/${parts[1]}/${parts[0]}`
                }}
              />
              <Bar dataKey="total" fill="#228be6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Stack>
  )
}
