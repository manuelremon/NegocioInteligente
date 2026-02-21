import { useState, useEffect, useCallback } from 'react'
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Divider,
  Alert,
  Table,
  Select,
  Loader,
  Center,
  NumberInput
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useCartStore } from '@renderer/stores/cartStore'
import { useRegisterStore } from '@renderer/stores/registerStore'
import type { Customer, Sale } from '@renderer/types/ipc'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  credit: 'Fiado / Credito'
}

interface PaymentModalProps {
  opened: boolean
  onClose: () => void
  onConfirm: (sale: Sale) => void
}

export default function PaymentModal({
  opened,
  onClose,
  onConfirm
}: PaymentModalProps): JSX.Element {
  const items = useCartStore((s) => s.items)
  const getTotal = useCartStore((s) => s.getTotal)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const getTaxTotal = useCartStore((s) => s.getTaxTotal)
  const paymentMethod = useCartStore((s) => s.paymentMethod)
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod)
  const setCustomer = useCartStore((s) => s.setCustomer)
  const clear = useCartStore((s) => s.clear)
  const currentSession = useRegisterStore((s) => s.currentSession)

  const total = getTotal()
  const subtotal = getSubtotal()
  const taxTotal = getTaxTotal()

  const [amountTendered, setAmountTendered] = useState<number | string>(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountNum = typeof amountTendered === 'number' ? amountTendered : 0
  const change = paymentMethod === 'cash' ? Math.max(0, amountNum - total) : 0

  // Fetch customers when "Fiado" is selected
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true)
    try {
      const result = await window.api.customers.list({ isActive: true })
      if (result.ok) {
        setCustomers(result.data ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingCustomers(false)
    }
  }, [])

  useEffect(() => {
    if (opened && paymentMethod === 'credit' && customers.length === 0) {
      fetchCustomers()
    }
  }, [opened, paymentMethod, customers.length, fetchCustomers])

  // Reset state when modal opens
  useEffect(() => {
    if (opened) {
      setAmountTendered(total)
      setSelectedCustomerId(null)
      setError(null)
    }
  }, [opened, total])

  // Update tendered amount when total or method changes
  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setAmountTendered(total)
    }
  }, [paymentMethod, total])

  const selectedCustomer = customers.find(
    (c) => c.id.toString() === selectedCustomerId
  )

  const handleConfirm = async () => {
    if (!currentSession) {
      setError('No hay una sesion de caja abierta.')
      return
    }

    if (paymentMethod === 'credit' && !selectedCustomerId) {
      setError('Selecciona un cliente para ventas a credito.')
      return
    }

    if (paymentMethod === 'cash' && amountNum < total) {
      setError('El monto entregado es insuficiente.')
      return
    }

    if (items.length === 0) {
      setError('No hay productos en el carrito.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const saleData = {
        sessionId: currentSession.id,
        customerId: selectedCustomerId ? parseInt(selectedCustomerId, 10) : undefined,
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? amountNum : total,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate
        }))
      }

      const result = await window.api.sales.complete(saleData)

      if (result.ok && result.data) {
        setPaymentMethod(paymentMethod)
        if (selectedCustomerId && selectedCustomer) {
          setCustomer(parseInt(selectedCustomerId, 10), selectedCustomer.name)
        }
        clear()

        notifications.show({
          title: 'Venta completada',
          message: `Recibo ${result.data.receiptNumber}`,
          color: 'green'
        })

        onConfirm(result.data as Sale)
      } else {
        setError(result.error ?? 'Error al procesar la venta')
        notifications.show({
          title: 'Error en la venta',
          message: result.error ?? 'Error desconocido',
          color: 'red'
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
      notifications.show({
        title: 'Error',
        message,
        color: 'red'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const customerOptions = customers.map((c) => ({
    value: c.id.toString(),
    label: `${c.name}${c.currentBalance > 0 ? ` (Deuda: ${formatCurrency(c.currentBalance)})` : ''}`
  }))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="lg">
          Confirmar Venta
        </Text>
      }
      size="md"
      centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <Stack gap="md">
        {/* Sale summary table */}
        <Table verticalSpacing={4} horizontalSpacing="xs" withTableBorder withColumnBorders>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td w={160}><Text size="sm" fw={500}>Articulos:</Text></Table.Td>
              <Table.Td ta="right">
                <Text size="sm">{items.length} producto(s), {items.reduce((s, i) => s + i.quantity, 0)} unidad(es)</Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><Text size="sm" fw={500}>Subtotal:</Text></Table.Td>
              <Table.Td ta="right"><Text size="sm">{formatCurrency(subtotal)}</Text></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><Text size="sm" fw={500}>Impuestos:</Text></Table.Td>
              <Table.Td ta="right"><Text size="sm">{formatCurrency(taxTotal)}</Text></Table.Td>
            </Table.Tr>
            <Table.Tr style={{ background: 'linear-gradient(180deg, #2c3e50, #1a252f)' }}>
              <Table.Td><Text size="md" fw={700} c="white">TOTAL:</Text></Table.Td>
              <Table.Td ta="right"><Text size="md" fw={700} c="white">{formatCurrency(total)}</Text></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><Text size="sm" fw={500}>Metodo de pago:</Text></Table.Td>
              <Table.Td ta="right">
                <Text size="sm" fw={600} c="blue">{PAYMENT_LABELS[paymentMethod]}</Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        {/* Cash-specific: amount tendered + change */}
        {paymentMethod === 'cash' && (
          <Stack gap="sm">
            <NumberInput
              label="Monto entregado"
              value={amountTendered}
              onChange={setAmountTendered}
              min={0}
              decimalScale={2}
              fixedDecimalScale
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              size="md"
              disabled={submitting}
              styles={{
                input: { fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Consolas', monospace" }
              }}
            />
            <Group justify="space-between" px="xs">
              <Text size="sm" fw={600} c="green.7">Vuelto:</Text>
              <Text size="lg" fw={700} c="green.7" ff="monospace">
                {formatCurrency(change)}
              </Text>
            </Group>
            {/* Quick amount buttons */}
            <Group gap="xs">
              {[100, 200, 500, 1000, 2000, 5000, 10000, 20000].map((amount) => (
                <Button
                  key={amount}
                  variant="default"
                  size="xs"
                  onClick={() => setAmountTendered(amount)}
                  disabled={submitting}
                  styles={{
                    root: {
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '4px 8px'
                    }
                  }}
                >
                  ${amount.toLocaleString('es-AR')}
                </Button>
              ))}
            </Group>
          </Stack>
        )}

        {/* Credit-specific: customer selection */}
        {paymentMethod === 'credit' && (
          <Stack gap="sm">
            {loadingCustomers ? (
              <Center py="sm">
                <Loader size="sm" />
              </Center>
            ) : (
              <Select
                label="Cliente (requerido para Fiado)"
                placeholder="Seleccionar cliente..."
                data={customerOptions}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                searchable
                clearable
                disabled={submitting}
                nothingFoundMessage="No se encontraron clientes"
              />
            )}

            {selectedCustomer && (
              <Alert variant="light" color="yellow" title="Saldo actual del cliente">
                <Text size="sm">
                  {selectedCustomer.name} tiene una deuda de{' '}
                  <Text span fw={700}>
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </Text>
                </Text>
                {selectedCustomer.creditLimit > 0 && (
                  <Text size="xs" c="dimmed" mt={4}>
                    Limite: {formatCurrency(selectedCustomer.creditLimit)} |
                    Disponible:{' '}
                    {formatCurrency(
                      Math.max(0, selectedCustomer.creditLimit - selectedCustomer.currentBalance)
                    )}
                  </Text>
                )}
              </Alert>
            )}
          </Stack>
        )}

        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        <Divider />

        {/* Action buttons */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            size="md"
            color="green"
            onClick={handleConfirm}
            loading={submitting}
            disabled={
              (paymentMethod === 'cash' && amountNum < total) ||
              (paymentMethod === 'credit' && !selectedCustomerId) ||
              items.length === 0
            }
            styles={{
              root: {
                fontWeight: 700,
                fontSize: '15px',
                background: 'linear-gradient(180deg, #27ae60 0%, #1e8449 100%)',
                border: '1px solid #196f3d',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }
            }}
          >
            CONFIRMAR VENTA [F12]
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
