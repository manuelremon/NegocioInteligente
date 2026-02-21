import {
  Drawer,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Table,
  Button,
  LoadingOverlay,
  Paper,
  Divider,
  SimpleGrid
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState, useEffect, useCallback } from 'react'
import type { Customer, CustomerLedgerEntry } from '@renderer/types/ipc'
import PaymentModal from './PaymentModal'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface CustomerDetailProps {
  opened: boolean
  onClose: () => void
  customerId: number | null
}

export default function CustomerDetail({
  opened,
  onClose,
  customerId
}: CustomerDetailProps): JSX.Element {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    try {
      const [customerRes, ledgerRes] = await Promise.all([
        window.api.customers.getById(customerId),
        window.api.customers.getLedger(customerId)
      ])

      if (customerRes.ok && customerRes.data) {
        setCustomer(customerRes.data as Customer)
      } else {
        notifications.show({
          title: 'Error',
          message: customerRes.error || 'No se pudo cargar el cliente',
          color: 'red'
        })
      }

      if (ledgerRes.ok && ledgerRes.data) {
        setLedger(ledgerRes.data as CustomerLedgerEntry[])
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al cargar datos del cliente',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    if (opened && customerId) {
      fetchData()
    }
    if (!opened) {
      setCustomer(null)
      setLedger([])
    }
  }, [opened, customerId, fetchData])

  const handlePaymentSaved = (): void => {
    fetchData()
  }

  const handleClose = (): void => {
    onClose()
  }

  return (
    <>
      <Drawer
        opened={opened}
        onClose={handleClose}
        title="Detalle del Cliente"
        position="right"
        size="lg"
        padding="md"
      >
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={loading} />

          {customer && (
            <Stack gap="md">
              {/* Customer Info Header */}
              <Paper p="md" withBorder>
                <Title order={3} mb="xs">
                  {customer.name}
                </Title>
                <SimpleGrid cols={2} spacing="xs">
                  {customer.phone && (
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        Tel:
                      </Text>
                      <Text size="sm">{customer.phone}</Text>
                    </Group>
                  )}
                  {customer.email && (
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        Email:
                      </Text>
                      <Text size="sm">{customer.email}</Text>
                    </Group>
                  )}
                  {customer.address && (
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        Dir:
                      </Text>
                      <Text size="sm">{customer.address}</Text>
                    </Group>
                  )}
                  {customer.taxId && (
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        CUIT/DNI:
                      </Text>
                      <Text size="sm">{customer.taxId}</Text>
                    </Group>
                  )}
                </SimpleGrid>
                {customer.notes && (
                  <Text size="xs" c="dimmed" mt="xs" fs="italic">
                    {customer.notes}
                  </Text>
                )}
              </Paper>

              {/* Balance Display */}
              <Paper p="md" withBorder>
                <SimpleGrid cols={2}>
                  <div>
                    <Text size="sm" c="dimmed">
                      Saldo actual
                    </Text>
                    <Text
                      size="xl"
                      fw={700}
                      c={customer.currentBalance > 0 ? 'red' : 'green'}
                    >
                      {formatCurrency(customer.currentBalance)}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">
                      Límite de crédito
                    </Text>
                    <Text size="xl" fw={700}>
                      {formatCurrency(customer.creditLimit)}
                    </Text>
                  </div>
                </SimpleGrid>

                {customer.currentBalance > 0 && (
                  <Button
                    mt="md"
                    color="green"
                    fullWidth
                    onClick={() => setPaymentOpen(true)}
                  >
                    Registrar Pago
                  </Button>
                )}
              </Paper>

              <Divider label="Historial de movimientos" labelPosition="center" />

              {/* Ledger Table */}
              {ledger.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No hay movimientos registrados
                </Text>
              ) : (
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Tipo</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Monto</Table.Th>
                      <Table.Th>Notas</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {ledger.map((entry) => (
                      <Table.Tr key={entry.id}>
                        <Table.Td>
                          <Text size="sm">{formatDate(entry.createdAt)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={entry.type === 'charge' ? 'red' : 'green'}
                            variant="light"
                            size="sm"
                          >
                            {entry.type === 'charge' ? 'Cargo' : 'Pago'}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text
                            size="sm"
                            fw={600}
                            c={entry.type === 'charge' ? 'red' : 'green'}
                          >
                            {entry.type === 'charge' ? '+' : '-'}
                            {formatCurrency(entry.amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {entry.notes || '-'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          )}
        </div>
      </Drawer>

      {customer && (
        <PaymentModal
          opened={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          customerId={customer.id}
          customerName={customer.name}
          currentBalance={customer.currentBalance}
          onSaved={handlePaymentSaved}
        />
      )}
    </>
  )
}
