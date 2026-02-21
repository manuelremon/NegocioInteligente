import { useCallback, useEffect, useState } from 'react'
import { Stack, Table, Text, Center, Loader, Alert, Paper } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import type { Debtor } from '@renderer/types/ipc'

const fmt = (v: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)

function getRowColor(balance: number, maxBalance: number): string | undefined {
  if (maxBalance === 0) return undefined
  const ratio = balance / maxBalance
  if (ratio >= 0.75) return 'var(--mantine-color-red-1)'
  if (ratio >= 0.5) return 'var(--mantine-color-orange-1)'
  if (ratio >= 0.25) return 'var(--mantine-color-yellow-1)'
  return undefined
}

export default function DebtorsReport(): JSX.Element {
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.reports.debtors()
      if (result.ok && result.data) {
        setDebtors(result.data as Debtor[])
      } else {
        setError(result.error ?? 'Error al cargar los deudores')
      }
    } catch {
      setError('Error de conexion al cargar deudores')
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar el reporte de deudores',
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

  const totalDebt = debtors.reduce((sum, d) => sum + d.currentBalance, 0)
  const maxBalance = debtors.length > 0 ? Math.max(...debtors.map((d) => d.currentBalance)) : 0

  return (
    <Stack gap="lg">
      {debtors.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No hay clientes con saldo pendiente
        </Text>
      ) : (
        <Paper withBorder p="md" radius="md">
          <Text fw={600} mb="md">
            Clientes con Saldo Pendiente
          </Text>
          <Table.ScrollContainer minWidth={600}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cliente</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Saldo Pendiente</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Ultima Compra</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {debtors.map((d) => (
                  <Table.Tr
                    key={d.customerId}
                    style={{ backgroundColor: getRowColor(d.currentBalance, maxBalance) }}
                  >
                    <Table.Td>
                      <Text fw={500}>{d.customerName}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text fw={700} c="red">
                        {fmt(d.currentBalance)}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text c="dimmed">
                        {d.lastPurchaseDate
                          ? dayjs(d.lastPurchaseDate).format('DD/MM/YYYY HH:mm')
                          : 'Sin compras'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr>
                  <Table.Td>
                    <Text fw={700}>TOTAL</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text fw={700} c="red" size="lg">
                      {fmt(totalDebt)}
                    </Text>
                  </Table.Td>
                  <Table.Td />
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}
    </Stack>
  )
}
