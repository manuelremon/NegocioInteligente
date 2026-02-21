import { useEffect, useState } from 'react'
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  Badge
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { Product } from '@renderer/types/ipc'

interface StockAdjustModalProps {
  opened: boolean
  onClose: () => void
  product: Product | null
  onSaved: () => void
}

export default function StockAdjustModal({
  opened,
  onClose,
  product,
  onSaved
}: StockAdjustModalProps): JSX.Element {
  const [adjustment, setAdjustment] = useState<number | string>(0)
  const [submitting, setSubmitting] = useState(false)

  // Reset adjustment when modal opens / product changes
  useEffect(() => {
    if (opened) {
      setAdjustment(0)
    }
  }, [opened, product])

  const numericAdjustment = typeof adjustment === 'number' ? adjustment : 0
  const resultingStock = product ? product.stock + numericAdjustment : 0
  const isValid = product !== null && numericAdjustment !== 0 && resultingStock >= 0

  const handleSubmit = async (): Promise<void> => {
    if (!product || !isValid) return
    setSubmitting(true)
    try {
      const res = await window.api.products.adjustStock({
        id: product.id,
        adjustment: numericAdjustment
      })
      if (res.ok) {
        notifications.show({
          title: 'Stock ajustado',
          message: `Stock de "${product.name}" ajustado en ${numericAdjustment > 0 ? '+' : ''}${numericAdjustment}. Nuevo stock: ${resultingStock}`,
          color: 'green'
        })
        onSaved()
      } else {
        notifications.show({
          title: 'Error',
          message: res.error ?? 'No se pudo ajustar el stock',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error de conexion al ajustar el stock',
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
      title="Ajustar Stock"
      size="sm"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      {product && (
        <Stack gap="md">
          <Text fw={600} size="lg">{product.name}</Text>

          <Group justify="space-between">
            <Text c="dimmed">Stock actual:</Text>
            <Badge size="lg" variant="light" color="blue">
              {product.stock}
            </Badge>
          </Group>

          <NumberInput
            label="Ajuste"
            description="Positivo para agregar, negativo para restar"
            placeholder="0"
            value={adjustment}
            onChange={setAdjustment}
            allowNegative
          />

          <Group justify="space-between">
            <Text c="dimmed">Stock resultante:</Text>
            <Badge
              size="lg"
              variant="filled"
              color={resultingStock < 0 ? 'red' : resultingStock <= (product.minStock ?? 0) ? 'orange' : 'green'}
            >
              {resultingStock}
            </Badge>
          </Group>

          {resultingStock < 0 && (
            <Text size="sm" c="red">
              El stock resultante no puede ser negativo
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!isValid}>
              Confirmar Ajuste
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
