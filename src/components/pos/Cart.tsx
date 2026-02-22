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
      <ScrollArea style={{ flex: 1 }} offsetScrollbars type="auto">
        <Table
          verticalSpacing={6}
          horizontalSpacing="sm"
          withTableBorder
          style={{ fontSize: '13px' }}
        >
          <Table.Thead>
            <Table.Tr style={{ background: '#f8fafc' }}>
              <Table.Th w={36} ta="center">
                <Text size="xs" c="dimmed" fw={600}>#</Text>
              </Table.Th>
              <Table.Th>
                <Text size="xs" c="dimmed" fw={600}>Producto</Text>
              </Table.Th>
              <Table.Th w={70} ta="center">
                <Text size="xs" c="dimmed" fw={600}>Cant.</Text>
              </Table.Th>
              <Table.Th w={100} ta="right">
                <Text size="xs" c="dimmed" fw={600}>Precio</Text>
              </Table.Th>
              <Table.Th w={110} ta="right">
                <Text size="xs" c="dimmed" fw={600}>Subtotal</Text>
              </Table.Th>
              <Table.Th w={36} ta="center">
                <Text size="xs" c="dimmed" fw={600}></Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center" py="xl">
                  <Text size="sm" c="dimmed">
                    No hay productos. Escanee o busque un producto para agregar.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item, index) => {
                const lineGross = item.unitPrice * item.quantity
                const lineDiscount = lineGross * (item.discountPercent / 100)
                const lineTotal = lineGross - lineDiscount

                return (
                  <Table.Tr key={item.productId}>
                    <Table.Td ta="center">
                      <Text size="xs" c="dimmed">{index + 1}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {item.productName}
                        {item.discountPercent > 0 && (
                          <Text span size="xs" c="orange" ml={6}>
                            -{item.discountPercent}%
                          </Text>
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
                        w={56}
                        styles={{
                          input: {
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: 600,
                            height: 28,
                            minHeight: 28
                          }
                        }}
                        hideControls
                      />
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" c="dimmed">{formatCurrency(item.unitPrice)}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" fw={600}>{formatCurrency(lineTotal)}</Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        radius="xl"
                        onClick={() => removeItem(item.productId)}
                        title="Quitar"
                      >
                        <Text size="xs" fw={700}>X</Text>
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
        padding: '6px 16px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <Text size="xs" fw={500} c="dimmed">
          {totalArticles} articulo(s)
        </Text>
        <Text size="xs" fw={500} c="dimmed">
          {items.length} linea(s)
        </Text>
      </div>
    </div>
  )
}
