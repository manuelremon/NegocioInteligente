import { useState } from 'react'
import { Card, NumberInput, Button, Text, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { RegisterSession } from '@renderer/types/ipc'

interface OpenSessionFormProps {
  onSessionOpened: (session: RegisterSession) => void
}

export default function OpenSessionForm({ onSessionOpened }: OpenSessionFormProps): JSX.Element {
  const [amount, setAmount] = useState<number | string>(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (): Promise<void> => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numericAmount) || numericAmount < 0) {
      notifications.show({
        title: 'Error',
        message: 'Ingrese un monto inicial valido',
        color: 'red'
      })
      return
    }

    setLoading(true)
    try {
      const result = await window.api.cash.openSession({ openingFloat: numericAmount })
      if (result.ok && result.data) {
        notifications.show({
          title: 'Caja abierta',
          message: 'La sesion de caja se abrio correctamente',
          color: 'green'
        })
        onSessionOpened(result.data as RegisterSession)
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'No se pudo abrir la caja',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al abrir la caja',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card withBorder p="xl" radius="md" maw={450} mx="auto">
      <Stack gap="lg">
        <Text fw={600} size="lg" ta="center">
          Abrir Caja
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          No hay una sesion de caja activa. Ingrese el monto inicial para comenzar.
        </Text>
        <NumberInput
          label="Monto inicial en caja"
          placeholder="0.00"
          prefix="$ "
          min={0}
          decimalScale={2}
          thousandSeparator="."
          decimalSeparator=","
          value={amount}
          onChange={setAmount}
          size="md"
        />
        <Button size="md" fullWidth onClick={handleSubmit} loading={loading}>
          Abrir Caja
        </Button>
      </Stack>
    </Card>
  )
}
