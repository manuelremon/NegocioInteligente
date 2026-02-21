import { useState } from 'react'
import { Modal, NumberInput, TextInput, Button, Group, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'

interface CashMovementModalProps {
  opened: boolean
  onClose: () => void
  sessionId: number
  type: 'in' | 'out'
  onSaved: () => void
}

export default function CashMovementModal({
  opened,
  onClose,
  sessionId,
  type,
  onSaved
}: CashMovementModalProps): JSX.Element {
  const [amount, setAmount] = useState<number | string>(0)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const title = type === 'in' ? 'Ingreso de Efectivo' : 'Egreso de Efectivo'
  const color = type === 'in' ? 'teal' : 'red'

  const handleSubmit = async (): Promise<void> => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numericAmount) || numericAmount <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Ingrese un monto valido mayor a cero',
        color: 'red'
      })
      return
    }

    if (!reason.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Ingrese un motivo para el movimiento',
        color: 'red'
      })
      return
    }

    setLoading(true)
    try {
      const result = await window.api.cash.addMovement({
        sessionId,
        amount: numericAmount,
        type,
        reason: reason.trim()
      })
      if (result.ok) {
        notifications.show({
          title: type === 'in' ? 'Ingreso registrado' : 'Egreso registrado',
          message: `El movimiento de efectivo se registro correctamente`,
          color: 'green'
        })
        setAmount(0)
        setReason('')
        onSaved()
        onClose()
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'No se pudo registrar el movimiento',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al registrar el movimiento',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack gap="md">
        <NumberInput
          label="Monto"
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
        <TextInput
          label="Motivo"
          placeholder={type === 'in' ? 'Ej: Cambio adicional' : 'Ej: Pago a proveedor'}
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          size="md"
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button color={color} onClick={handleSubmit} loading={loading}>
            {type === 'in' ? 'Registrar Ingreso' : 'Registrar Egreso'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
