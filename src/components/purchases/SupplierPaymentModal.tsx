import { useEffect, useState } from 'react'
import { Button, Group, Modal, NumberInput, Stack, Text, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Supplier } from '@renderer/types/ipc'

const fmt = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

interface SupplierPaymentModalProps {
  opened: boolean
  onClose: () => void
  supplier: Supplier | null
  onSaved: () => void
}

interface PaymentFormValues {
  amount: number
  notes: string
}

export default function SupplierPaymentModal({
  opened,
  onClose,
  supplier,
  onSaved
}: SupplierPaymentModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<PaymentFormValues>({
    initialValues: {
      amount: 0,
      notes: ''
    },
    validate: {
      amount: (v) => (v <= 0 ? 'El monto debe ser mayor a 0' : null)
    }
  })

  useEffect(() => {
    if (opened) {
      form.reset()
      if (supplier) {
        form.setFieldValue('amount', supplier.currentBalance)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, supplier])

  const handleSubmit = async (values: PaymentFormValues): Promise<void> => {
    if (!supplier) return
    setSubmitting(true)
    try {
      const res = await window.api.purchases.registerPayment({
        supplierId: supplier.id,
        amount: values.amount,
        notes: values.notes.trim() || null
      })

      if (res.ok) {
        notifications.show({
          title: 'Pago registrado',
          message: `Pago de ${fmt(values.amount)} a "${supplier.name}" registrado`,
          color: 'green'
        })
        onSaved()
      } else {
        notifications.show({
          title: 'Error',
          message: res.error ?? 'No se pudo registrar el pago',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error de conexion al registrar el pago',
        color: 'red'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Registrar Pago a Proveedor"
      size="sm"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      {supplier && (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Proveedor: <Text span c="blue.7">{supplier.name}</Text>
            </Text>
            <Text size="sm">
              Deuda actual: <Text span fw={700} c="red.7">{fmt(supplier.currentBalance)}</Text>
            </Text>

            <NumberInput
              label="Monto del pago"
              placeholder="0.00"
              min={0.01}
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
              thousandSeparator="."
              decimalSeparator=","
              required
              {...form.getInputProps('amount')}
            />

            <Textarea
              label="Notas"
              placeholder="Detalle del pago..."
              rows={2}
              {...form.getInputProps('notes')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={onClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" color="green" loading={submitting}>
                Registrar Pago
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
