import { useCallback, useEffect, useState } from 'react'
import { Stack, Table, Text, Center, Loader, Alert, Paper } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import type { RegisterSession } from '@renderer/types/ipc'

const fmt = (v: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)

function getDifferenceColor(diff: number): string {
  if (diff === 0) return 'green'
  if (diff < 0) return 'red'
  return 'yellow.8'
}

interface CashReportProps {
  from: string
  to: string
}

export default function CashReport({ from, to }: CashReportProps): JSX.Element {
  const [sessions, setSessions] = useState<RegisterSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.reports.cashHistory({ from, to })
      if (result.ok && result.data) {
        setSessions(result.data as RegisterSession[])
      } else {
        setError(result.error ?? 'Error al cargar el historial de caja')
      }
    } catch {
      setError('Error de conexion al cargar historial de caja')
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar el reporte de caja',
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

  if (sessions.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No hay sesiones de caja en el periodo seleccionado
      </Text>
    )
  }

  return (
    <Stack gap="lg">
      <Paper withBorder p="md" radius="md">
        <Text fw={600} mb="md">
          Historial de Sesiones de Caja
        </Text>
        <Table.ScrollContainer minWidth={1100}>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Apertura</Table.Th>
                <Table.Th>Cierre</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Monto Inicial</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Ventas Efectivo</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Ventas Tarjeta</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Ingresos</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Egresos</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Esperado</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Contado</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Diferencia</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.map((s) => {
                const expected =
                  s.openingFloat + s.cashSales - s.refunds + s.cashIn - s.cashOut
                const counted = s.closingFloat ?? 0
                const difference = s.status === 'closed' ? counted - expected : 0

                return (
                  <Table.Tr key={s.id}>
                    <Table.Td>
                      <Text size="sm">{dayjs(s.openedAt).format('DD/MM/YYYY HH:mm')}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={s.closedAt ? undefined : 'dimmed'}>
                        {s.closedAt
                          ? dayjs(s.closedAt).format('DD/MM/YYYY HH:mm')
                          : 'Abierta'}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {fmt(s.openingFloat)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text c="green">{fmt(s.cashSales)}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text c="blue">{fmt(s.cardSales)}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text c="teal">{fmt(s.cashIn)}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text c="red">{fmt(s.cashOut)}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text fw={600}>{fmt(expected)}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text fw={600}>
                        {s.status === 'closed' ? fmt(counted) : '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {s.status === 'closed' ? (
                        <Text fw={700} c={getDifferenceColor(difference)}>
                          {fmt(difference)}
                        </Text>
                      ) : (
                        <Text c="dimmed">-</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Stack>
  )
}
