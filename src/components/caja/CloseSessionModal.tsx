import { useState } from 'react'
import { Modal, NumberInput, TextInput, Button, Group, Stack, Text, Divider, SimpleGrid, Paper } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { RegisterSession } from '@renderer/types/ipc'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

interface CloseSessionModalProps {
  opened: boolean
  onClose: () => void
  session: RegisterSession
  onSessionClosed: () => void
}

export default function CloseSessionModal({
  opened,
  onClose,
  session,
  onSessionClosed
}: CloseSessionModalProps): JSX.Element {
  const [closingFloat, setClosingFloat] = useState<number | string>(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const expected =
    session.openingFloat +
    session.cashSales -
    session.refunds +
    session.cashIn -
    session.cashOut

  const numericClosing = typeof closingFloat === 'string' ? parseFloat(closingFloat) || 0 : closingFloat
  const difference = numericClosing - expected

  const handleClose = async (): Promise<void> => {
    if (isNaN(numericClosing) || numericClosing < 0) {
      notifications.show({
        title: 'Error',
        message: 'Ingrese un monto contado valido',
        color: 'red'
      })
      return
    }

    setLoading(true)
    try {
      const result = await window.api.cash.closeSession({
        id: session.id,
        closingFloat: numericClosing,
        notes: notes.trim() || null
      })
      if (result.ok) {
        notifications.show({
          title: 'Caja cerrada',
          message: 'La sesion de caja se cerro correctamente',
          color: 'green'
        })
        onSessionClosed()
        onClose()
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'No se pudo cerrar la caja',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al cerrar la caja',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Cerrar Caja" size="lg" centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Revise el resumen de la sesion y cuente el efectivo en caja para cerrar.
        </Text>

        <SimpleGrid cols={2} spacing="sm">
          <Paper withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">Monto inicial</Text>
            <Text fw={600}>{formatCurrency(session.openingFloat)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">Ventas efectivo</Text>
            <Text fw={600} c="green">{formatCurrency(session.cashSales)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">Ventas tarjeta</Text>
            <Text fw={600} c="blue">{formatCurrency(session.cardSales)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">Ventas fiado</Text>
            <Text fw={600} c="orange">{formatCurrency(session.otherSales)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">Ingresos</Text>
            <Text fw={600} c="teal">{formatCurrency(session.cashIn)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">Egresos</Text>
            <Text fw={600} c="red">{formatCurrency(session.cashOut)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="md">
            <Text size="xs" c="dimmed">Reembolsos</Text>
            <Text fw={600} c="red">{formatCurrency(session.refunds)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="md" bg="violet.0">
            <Text size="xs" c="dimmed">Esperado en caja</Text>
            <Text fw={700} c="violet">{formatCurrency(expected)}</Text>
          </Paper>
        </SimpleGrid>

        <Divider />

        <NumberInput
          label="Monto contado en caja"
          placeholder="0.00"
          prefix="$ "
          min={0}
          decimalScale={2}
          thousandSeparator="."
          decimalSeparator=","
          value={closingFloat}
          onChange={setClosingFloat}
          size="md"
        />

        <Paper
          withBorder
          p="md"
          radius="md"
          bg={difference === 0 ? 'green.0' : 'red.0'}
        >
          <Group justify="space-between">
            <Text fw={600}>Diferencia:</Text>
            <Text fw={700} size="lg" c={difference === 0 ? 'green' : 'red'}>
              {formatCurrency(difference)}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mt={4}>
            {difference === 0
              ? 'El conteo coincide con el esperado'
              : difference > 0
                ? 'Sobrante en caja'
                : 'Faltante en caja'}
          </Text>
        </Paper>

        <TextInput
          label="Notas (opcional)"
          placeholder="Observaciones al cierre..."
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="red" onClick={handleClose} loading={loading}>
            Cerrar Caja
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
