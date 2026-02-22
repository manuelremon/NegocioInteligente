import { useEffect, useState, useCallback } from 'react'
import { Stack, Title, Group, Button, Table, Badge, Text, LoadingOverlay, Paper } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useRegisterStore } from '@renderer/stores/registerStore'
import type { RegisterSession } from '@renderer/types/ipc'
import OpenSessionForm from '@renderer/components/caja/OpenSessionForm'
import SessionSummary from '@renderer/components/caja/SessionSummary'
import CloseSessionModal from '@renderer/components/caja/CloseSessionModal'
import CashMovementModal from '@renderer/components/caja/CashMovementModal'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function CajaPage(): JSX.Element {
  const { currentSession, setSession, clearSession } = useRegisterStore()
  const [history, setHistory] = useState<RegisterSession[]>([])
  const [loading, setLoading] = useState(true)

  const [closeModalOpened, closeModalHandlers] = useDisclosure(false)
  const [cashInOpened, cashInHandlers] = useDisclosure(false)
  const [cashOutOpened, cashOutHandlers] = useDisclosure(false)

  const fetchActiveSession = useCallback(async () => {
    try {
      const result = await window.api.cash.getActiveSession()
      if (result.ok && result.data) {
        setSession(result.data as RegisterSession)
      } else {
        clearSession()
      }
    } catch {
      clearSession()
    }
  }, [setSession, clearSession])

  const fetchHistory = useCallback(async () => {
    try {
      const result = await window.api.cash.getSessionHistory()
      if (result.ok && result.data) {
        setHistory(result.data as RegisterSession[])
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar el historial de sesiones',
        color: 'red'
      })
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchActiveSession(), fetchHistory()])
    setLoading(false)
  }, [fetchActiveSession, fetchHistory])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleSessionOpened = (session: RegisterSession): void => {
    setSession(session)
    fetchHistory()
  }

  const handleSessionClosed = (): void => {
    clearSession()
    fetchHistory()
  }

  const handleMovementSaved = (): void => {
    fetchActiveSession()
  }

  return (
    <Stack gap="lg" pos="relative">
      <LoadingOverlay visible={loading} />

      <Title order={3} c="#1e293b">Caja Registradora</Title>

      {/* Active session area */}
      {!currentSession ? (
        <OpenSessionForm onSessionOpened={handleSessionOpened} />
      ) : (
        <Stack gap="md">
          <SessionSummary session={currentSession} />

          <Group>
            <Button color="teal" variant="light" radius="md" onClick={cashInHandlers.open}>
              Ingreso de Efectivo
            </Button>
            <Button color="red" variant="light" radius="md" onClick={cashOutHandlers.open}>
              Egreso de Efectivo
            </Button>
            <Button color="red" radius="md" onClick={closeModalHandlers.open} ml="auto">
              Cerrar Caja
            </Button>
          </Group>

          <CloseSessionModal
            opened={closeModalOpened}
            onClose={closeModalHandlers.close}
            session={currentSession}
            onSessionClosed={handleSessionClosed}
          />

          <CashMovementModal
            opened={cashInOpened}
            onClose={cashInHandlers.close}
            sessionId={currentSession.id}
            type="in"
            onSaved={handleMovementSaved}
          />

          <CashMovementModal
            opened={cashOutOpened}
            onClose={cashOutHandlers.close}
            sessionId={currentSession.id}
            type="out"
            onSaved={handleMovementSaved}
          />
        </Stack>
      )}

      {/* Session history */}
      <Paper withBorder p="lg" radius="lg" bg="white">
        <Title order={4} mb="md" c="#1e293b">
          Historial de Sesiones
        </Title>

        {history.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No hay sesiones anteriores registradas.
          </Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr style={{ background: '#f8fafc' }}>
                <Table.Th><Text size="xs" c="#64748b" fw={600}>Fecha Apertura</Text></Table.Th>
                <Table.Th><Text size="xs" c="#64748b" fw={600}>Fecha Cierre</Text></Table.Th>
                <Table.Th ta="right"><Text size="xs" c="#64748b" fw={600}>Monto Inicial</Text></Table.Th>
                <Table.Th ta="right"><Text size="xs" c="#64748b" fw={600}>Monto Final</Text></Table.Th>
                <Table.Th ta="right"><Text size="xs" c="#64748b" fw={600}>Esperado</Text></Table.Th>
                <Table.Th ta="right"><Text size="xs" c="#64748b" fw={600}>Diferencia</Text></Table.Th>
                <Table.Th ta="center"><Text size="xs" c="#64748b" fw={600}>Estado</Text></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.map((s) => {
                const expected =
                  s.openingFloat + s.cashSales - s.refunds + s.cashIn - s.cashOut
                const diff =
                  s.closingFloat != null ? s.closingFloat - expected : null

                return (
                  <Table.Tr key={s.id}>
                    <Table.Td><Text size="sm">{formatDate(s.openedAt)}</Text></Table.Td>
                    <Table.Td><Text size="sm">{formatDate(s.closedAt)}</Text></Table.Td>
                    <Table.Td ta="right"><Text size="sm">{formatCurrency(s.openingFloat)}</Text></Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm">{s.closingFloat != null ? formatCurrency(s.closingFloat) : '-'}</Text>
                    </Table.Td>
                    <Table.Td ta="right"><Text size="sm">{formatCurrency(expected)}</Text></Table.Td>
                    <Table.Td ta="right">
                      {diff != null ? (
                        <Text
                          span
                          fw={600}
                          size="sm"
                          c={diff === 0 ? 'green' : 'red'}
                        >
                          {formatCurrency(diff)}
                        </Text>
                      ) : (
                        '-'
                      )}
                    </Table.Td>
                    <Table.Td ta="center">
                      <Badge
                        color={s.status === 'open' ? 'green' : 'gray'}
                        variant="light"
                        radius="md"
                      >
                        {s.status === 'open' ? 'Abierta' : 'Cerrada'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  )
}
