import {
  Table,
  Text,
  NumberInput,
  ActionIcon,
  ScrollArea
} from '@mantine/core'
import { useCartStore } from '@renderer/stores/cartStore'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

export default function Cart(): JSX.Element {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)

  const totalArticles = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Scrollable table area */}
      <ScrollArea style={{ flex: 1 }} offsetScrollbars type="auto">
        <Table
          verticalSpacing={3}
          horizontalSpacing="xs"
          striped
          highlightOnHover
          withTableBorder
          withColumnBorders
          style={{ fontSize: '12px' }}
        >
          <Table.Thead>
            <Table.Tr style={{
              background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)'
            }}>
              <Table.Th w={30} ta="center" style={{ position: 'sticky', top: 0 }}>
                <Text size="xs" c="white" fw={700}>#</Text>
              </Table.Th>
              <Table.Th w={80} style={{ position: 'sticky', top: 0 }}>
                <Text size="xs" c="white" fw={700}>Codigo</Text>
              </Table.Th>
              <Table.Th style={{ position: 'sticky', top: 0 }}>
                <Text size="xs" c="white" fw={700}>Descripcion</Text>
              </Table.Th>
              <Table.Th w={60} ta="center" style={{ position: 'sticky', top: 0 }}>
                <Text size="xs" c="white" fw={700}>Cant.</Text>
              </Table.Th>
              <Table.Th w={95} ta="right" style={{ position: 'sticky', top: 0 }}>
                <Text size="xs" c="white" fw={700}>Precio Unit.</Text>
              </Table.Th>
              <Table.Th w={100} ta="right" style={{ position: 'sticky', top: 0 }}>
                <Text size="xs" c="white" fw={700}>Subtotal</Text>
              </Table.Th>
              <Table.Th w={32} ta="center" style={{ position: 'sticky', top: 0 }}>
                <Text size="xs" c="white" fw={700}>X</Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center" py="xl">
                  <Text size="sm" c="dimmed">
                    No hay productos en la venta. Escanee o busque un producto para agregar.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item, index) => {
                const lineGross = item.unitPrice * item.quantity
                const lineDiscount = lineGross * (item.discountPercent / 100)
                const lineTotal = lineGross - lineDiscount

                return (
                  <Table.Tr key={item.productId} style={{
                    background: index % 2 === 0 ? '#ffffff' : '#f2f6fa'
                  }}>
                    <Table.Td ta="center">
                      <Text size="xs" c="dimmed" style={{ fontSize: 11 }}>{index + 1}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" ff="monospace" truncate="end" style={{ fontSize: 11 }}>
                        {item.productId}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={500} lineClamp={1} style={{ fontSize: 12 }}>
                        {item.productName}
                        {item.discountPercent > 0 && (
                          <span style={{ color: '#e67e22', fontSize: 10, marginLeft: 4 }}>
                            (-{item.discountPercent}%)
                          </span>
                        )}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <NumberInput
                        value={item.quantity}
                        onChange={(val) => {
                          const n = typeof val === 'number' ? val : 1
                          if (n <= 0) {
                            removeItem(item.productId)
                          } else {
                            updateQty(item.productId, n)
                          }
                        }}
                        min={1}
                        max={item.stock > 0 ? item.stock : undefined}
                        size="xs"
                        w={50}
                        styles={{
                          input: {
                            textAlign: 'center',
                            padding: '1px 2px',
                            fontSize: '12px',
                            fontWeight: 600,
                            height: 24,
                            minHeight: 24
                          }
                        }}
                        hideControls
                      />
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="xs" style={{ fontSize: 12 }}>{formatCurrency(item.unitPrice)}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="xs" fw={600} style={{ fontSize: 12 }}>{formatCurrency(lineTotal)}</Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => removeItem(item.productId)}
                        title="Quitar del comprobante"
                      >
                        <Text size="xs" fw={700} style={{ fontSize: 11 }}>X</Text>
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                )
              })
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Article count bar */}
      <div style={{
        padding: '4px 12px',
        background: '#e8e8e8',
        borderTop: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <Text size="xs" fw={600} c="dimmed" style={{ fontSize: 12 }}>
          Cant. Articulos: {totalArticles}
        </Text>
        <Text size="xs" fw={600} c="dimmed" style={{ fontSize: 12 }}>
          {items.length} linea(s)
        </Text>
      </div>
    </div>
  )
}
