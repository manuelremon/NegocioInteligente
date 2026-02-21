import {
  Modal,
  Stack,
  Text,
  Table,
  Divider,
  Group,
  Button,
  Paper,
  Center
} from '@mantine/core'
import dayjs from 'dayjs'
import type { Sale } from '@renderer/types/ipc'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  credit: 'Fiado / Credito'
}

interface ReceiptModalProps {
  opened: boolean
  onClose: () => void
  sale: Sale | null
}

export default function ReceiptModal({
  opened,
  onClose,
  sale
}: ReceiptModalProps): JSX.Element {
  if (!sale) {
    return (
      <Modal opened={opened} onClose={onClose} title="Comprobante" centered size="sm">
        <Center py="xl">
          <Text c="dimmed">No hay datos del comprobante.</Text>
        </Center>
      </Modal>
    )
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="lg">
          Comprobante de Venta
        </Text>
      }
      centered
      size="md"
    >
      <Paper
        p="lg"
        withBorder
        radius="sm"
        style={{
          fontFamily: "'Consolas', 'Courier New', monospace",
          backgroundColor: '#fafafa',
          border: '1px solid #ccc'
        }}
      >
        <Stack gap="sm">
          {/* Header */}
          <Center>
            <Stack gap={2} align="center">
              <Text fw={700} size="lg" style={{ letterSpacing: 1 }}>NegocioInteligente</Text>
              <Text size="xs" c="dimmed">Comprobante de Venta</Text>
            </Stack>
          </Center>

          <Divider variant="dashed" />

          {/* Receipt info */}
          <Table verticalSpacing={2} horizontalSpacing="xs" withColumnBorders>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td w={120}><Text size="xs" fw={600}>Recibo:</Text></Table.Td>
                <Table.Td><Text size="xs" fw={700}>{sale.receiptNumber}</Text></Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="xs" fw={600}>Fecha:</Text></Table.Td>
                <Table.Td><Text size="xs">{dayjs(sale.createdAt).format('DD/MM/YYYY HH:mm')}</Text></Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="xs" fw={600}>Metodo:</Text></Table.Td>
                <Table.Td><Text size="xs">{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</Text></Table.Td>
              </Table.Tr>
              {sale.customerName && (
                <Table.Tr>
                  <Table.Td><Text size="xs" fw={600}>Cliente:</Text></Table.Td>
                  <Table.Td><Text size="xs">{sale.customerName}</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Divider variant="dashed" />

          {/* Items */}
          {sale.items && sale.items.length > 0 ? (
            <Table
              verticalSpacing={3}
              horizontalSpacing="xs"
              withTableBorder
              withColumnBorders
              striped
              style={{ fontSize: 11 }}
            >
              <Table.Thead>
                <Table.Tr style={{ background: '#2c3e50' }}>
                  <Table.Th><Text size="xs" c="white" fw={700}>Producto</Text></Table.Th>
                  <Table.Th ta="center" w={50}><Text size="xs" c="white" fw={700}>Cant.</Text></Table.Th>
                  <Table.Th ta="right" w={85}><Text size="xs" c="white" fw={700}>P/U</Text></Table.Th>
                  <Table.Th ta="right" w={90}><Text size="xs" c="white" fw={700}>Total</Text></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sale.items.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Text size="xs" lineClamp={1}>{item.productName}</Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Text size="xs">{item.quantity}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="xs">{formatCurrency(item.unitPrice)}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="xs" fw={600}>{formatCurrency(item.lineTotal)}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text size="xs" c="dimmed" ta="center">
              Sin detalle de items
            </Text>
          )}

          <Divider variant="dashed" />

          {/* Totals */}
          <Stack gap={3}>
            <Group justify="space-between" px={4}>
              <Text size="sm" c="dimmed">Subtotal:</Text>
              <Text size="sm">{formatCurrency(sale.subtotal)}</Text>
            </Group>

            {sale.discountTotal > 0 && (
              <Group justify="space-between" px={4}>
                <Text size="sm" c="orange">Descuentos:</Text>
                <Text size="sm" c="orange">-{formatCurrency(sale.discountTotal)}</Text>
              </Group>
            )}

            <Group justify="space-between" px={4}>
              <Text size="sm" c="dimmed">Impuestos:</Text>
              <Text size="sm">{formatCurrency(sale.taxTotal)}</Text>
            </Group>

            <div style={{
              background: 'linear-gradient(180deg, #2c3e50, #1a252f)',
              padding: '6px 10px',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text size="md" fw={700} c="white">TOTAL:</Text>
              <Text size="md" fw={700} c="white">{formatCurrency(sale.total)}</Text>
            </div>

            {sale.paymentMethod === 'cash' && (
              <>
                <Group justify="space-between" px={4}>
                  <Text size="sm" c="dimmed">Entregado:</Text>
                  <Text size="sm" fw={500}>{formatCurrency(sale.amountTendered)}</Text>
                </Group>
                <Group justify="space-between" px={4}>
                  <Text size="sm" fw={700} c="green">Vuelto:</Text>
                  <Text size="sm" fw={700} c="green">
                    {formatCurrency(sale.change)}
                  </Text>
                </Group>
              </>
            )}
          </Stack>

          <Divider variant="dashed" />

          <Center>
            <Text size="xs" c="dimmed">Gracias por su compra</Text>
          </Center>
        </Stack>
      </Paper>

      <Group justify="center" mt="md" gap="sm">
        <Button
          variant="default"
          onClick={onClose}
          styles={{
            root: {
              fontWeight: 600,
              background: 'linear-gradient(180deg, #f0f0f0 0%, #d8d8d8 100%)',
              border: '1px solid #aaa',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }
          }}
        >
          Cerrar [Esc]
        </Button>
      </Group>
    </Modal>
  )
}
