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

      <Title order={2}>Caja Registradora</Title>

      {/* Active session area */}
      {!currentSession ? (
        <OpenSessionForm onSessionOpened={handleSessionOpened} />
      ) : (
        <Stack gap="md">
          <SessionSummary session={currentSession} />

          <Group>
            <Button color="teal" variant="light" onClick={cashInHandlers.open}>
              Ingreso de Efectivo
            </Button>
            <Button color="red" variant="light" onClick={cashOutHandlers.open}>
              Egreso de Efectivo
            </Button>
            <Button color="red" onClick={closeModalHandlers.open} ml="auto">
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
      <Paper withBorder p="lg" radius="md">
        <Title order={4} mb="md">
          Historial de Sesiones
        </Title>

        {history.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No hay sesiones anteriores registradas.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha Apertura</Table.Th>
                <Table.Th>Fecha Cierre</Table.Th>
                <Table.Th ta="right">Monto Inicial</Table.Th>
                <Table.Th ta="right">Monto Final</Table.Th>
                <Table.Th ta="right">Esperado</Table.Th>
                <Table.Th ta="right">Diferencia</Table.Th>
                <Table.Th ta="center">Estado</Table.Th>
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
                    <Table.Td>{formatDate(s.openedAt)}</Table.Td>
                    <Table.Td>{formatDate(s.closedAt)}</Table.Td>
                    <Table.Td ta="right">{formatCurrency(s.openingFloat)}</Table.Td>
                    <Table.Td ta="right">
                      {s.closingFloat != null ? formatCurrency(s.closingFloat) : '-'}
                    </Table.Td>
                    <Table.Td ta="right">{formatCurrency(expected)}</Table.Td>
                    <Table.Td ta="right">
                      {diff != null ? (
                        <Text
                          span
                          fw={600}
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
