import { Modal, Stack, Text, Group, NumberInput, TextInput, Button } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

interface PaymentModalProps {
  opened: boolean
  onClose: () => void
  customerId: number
  customerName: string
  currentBalance: number
  onSaved: () => void
}

interface PaymentFormValues {
  amount: number | ''
  notes: string
}

export default function PaymentModal({
  opened,
  onClose,
  customerId,
  customerName,
  currentBalance,
  onSaved
}: PaymentModalProps): JSX.Element {
  const [loading, setLoading] = useState(false)

  const form = useForm<PaymentFormValues>({
    initialValues: {
      amount: '',
      notes: ''
    },
    validate: {
      amount: (value) => {
        if (!value || value <= 0) return 'El monto debe ser mayor a 0'
        if (value > currentBalance) return 'El monto no puede superar el saldo actual'
        return null
      }
    }
  })

  const handleSubmit = async (values: PaymentFormValues): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.customers.registerPayment({
        customerId,
        amount: values.amount as number,
        notes: values.notes || null
      })

      if (result.ok) {
        notifications.show({
          title: 'Pago registrado',
          message: `Se registró un pago de ${formatCurrency(values.amount as number)} para ${customerName}`,
          color: 'green'
        })
        form.reset()
        onSaved()
        onClose()
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'No se pudo registrar el pago',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al registrar el pago',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (): void => {
    form.reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Registrar Pago" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Cliente
            </Text>
            <Text fw={600}>{customerName}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Saldo actual
            </Text>
            <Text fw={700} c="red" size="lg">
              {formatCurrency(currentBalance)}
            </Text>
          </Group>

          <NumberInput
            label="Monto del pago"
            placeholder="0.00"
            min={0.01}
            max={currentBalance}
            step={0.01}
            decimalScale={2}
            prefix="$ "
            thousandSeparator="."
            decimalSeparator=","
            required
            {...form.getInputProps('amount')}
          />

          <TextInput
            label="Notas"
            placeholder="Referencia de pago, medio, etc."
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} color="green">
              Registrar Pago
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
