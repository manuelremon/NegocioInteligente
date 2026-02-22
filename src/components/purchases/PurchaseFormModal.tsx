import { useCallback, useEffect, useState } from 'react'
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Box,
  Flex
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { Product, Supplier } from '@renderer/types/ipc'

const fmt = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

interface PurchaseLineItem {
  productId: number
  productName: string
  quantity: number
  unitCost: number
  taxRate: number
  lineTotal: number
}

interface PurchaseFormModalProps {
  opened: boolean
  onClose: () => void
  onSaved: () => void
}

const cellStyle: React.CSSProperties = { fontSize: 12, padding: '3px 6px', whiteSpace: 'nowrap' }
const cellRight: React.CSSProperties = { ...cellStyle, textAlign: 'right' }
const thStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '4px 6px',
  fontWeight: 700,
  background: 'linear-gradient(180deg, #f0f2f5 0%, #dcdfe4 100%)',
  whiteSpace: 'nowrap'
}
const thRight: React.CSSProperties = { ...thStyle, textAlign: 'right' }

export default function PurchaseFormModal({
  opened,
  onClose,
  onSaved
}: PurchaseFormModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string | null>('cash')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseLineItem[]>([])

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    const res = await window.api.purchases.listSuppliers({ isActive: true })
    if (res.ok && res.data) setSuppliers(res.data)
  }, [])

  useEffect(() => {
    if (opened) {
      fetchSuppliers()
      setSupplierId(null)
      setReceiptNumber('')
      setPaymentMethod('cash')
      setNotes('')
      setItems([])
      setProductSearch('')
      setProductResults([])
    }
  }, [opened, fetchSuppliers])

  // Search products with debounce
  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true)
      try {
        const res = await window.api.products.search(productSearch)
        if (res.ok && res.data) setProductResults(res.data)
      } catch { /* ignore */ }
      finally { setSearchingProducts(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const addProduct = (product: Product): void => {
    // Check if already in list
    const existing = items.find((i) => i.productId === product.id)
    if (existing) {
      setItems(items.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitCost * (1 + i.taxRate / 100) }
          : i
      ))
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitCost: product.costPrice,
          taxRate: product.taxRate,
          lineTotal: product.costPrice * (1 + product.taxRate / 100)
        }
      ])
    }
    setProductSearch('')
    setProductResults([])
  }

  const updateItemField = (
    index: number,
    field: 'quantity' | 'unitCost' | 'taxRate',
    value: number
  ): void => {
    setItems(items.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      updated.lineTotal = updated.quantity * updated.unitCost * (1 + updated.taxRate / 100)
      return updated
    }))
  }

  const removeItem = (index: number): void => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitCost, 0)
  const taxTotal = items.reduce((s, i) => s + i.quantity * i.unitCost * (i.taxRate / 100), 0)
  const total = subtotal + taxTotal

  const handleSubmit = async (): Promise<void> => {
    if (!supplierId) {
      notifications.show({ title: 'Error', message: 'Seleccione un proveedor', color: 'red' })
      return
    }
    if (items.length === 0) {
      notifications.show({ title: 'Error', message: 'Agregue al menos un producto', color: 'red' })
      return
    }
    if (!paymentMethod) {
      notifications.show({ title: 'Error', message: 'Seleccione metodo de pago', color: 'red' })
      return
    }

    setSubmitting(true)
    try {
      const res = await window.api.purchases.create({
        supplierId: Number(supplierId),
        receiptNumber: receiptNumber.trim() || undefined,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitCost: i.unitCost,
          taxRate: i.taxRate
        })),
        notes: notes.trim() || undefined
      })

      if (res.ok) {
        notifications.show({
          title: 'Compra registrada',
          message: `Compra por ${fmt(total)} registrada exitosamente`,
          color: 'green'
        })
        onSaved()
      } else {
        notifications.show({
          title: 'Error',
          message: res.error ?? 'No se pudo registrar la compra',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error de conexion al registrar la compra',
        color: 'red'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const supplierSelectData = suppliers.map((s) => ({
    value: String(s.id),
    label: s.name
  }))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nueva Compra"
      size="xl"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <Stack gap="sm">
        {/* Supplier + receipt */}
        <Group grow>
          <Select
            label="Proveedor"
            placeholder="Seleccionar proveedor"
            data={supplierSelectData}
            searchable
            required
            value={supplierId}
            onChange={setSupplierId}
          />
          <TextInput
            label="Nro. Factura / Remito"
            placeholder="Opcional"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.currentTarget.value)}
          />
          <Select
            label="Metodo de pago"
            data={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'credit', label: 'Credito (fiado)' }
            ]}
            value={paymentMethod}
            onChange={setPaymentMethod}
          />
        </Group>

        {/* Product search */}
        <Box style={{ position: 'relative' }}>
          <TextInput
            label="Agregar producto"
            placeholder="Buscar por nombre, codigo o SKU..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.currentTarget.value)}
            size="sm"
            rightSection={searchingProducts ? <Text size="xs" c="dimmed">...</Text> : undefined}
          />
          {productResults.length > 0 && (
            <Box
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: 4,
                maxHeight: 200,
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {productResults.map((p) => (
                <Box
                  key={p.id}
                  style={{
                    padding: '6px 10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    fontSize: 12
                  }}
                  onClick={() => addProduct(p)}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = '#e8f0fe'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'white'
                  }}
                >
                  <Flex justify="space-between">
                    <Text size="xs" fw={500}>{p.name}</Text>
                    <Text size="xs" c="dimmed">
                      Costo: {fmt(p.costPrice)} | Stock: {p.stock}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Items table */}
        <Table striped withTableBorder withColumnBorders style={{ fontSize: 12 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={thStyle}>Producto</Table.Th>
              <Table.Th style={thRight}>Cantidad</Table.Th>
              <Table.Th style={thRight}>Costo Unit.</Table.Th>
              <Table.Th style={thRight}>IVA %</Table.Th>
              <Table.Th style={thRight}>Total</Table.Th>
              <Table.Th style={thStyle}>-</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} style={cellStyle}>
                  <Text ta="center" c="dimmed" py="sm" size="xs">
                    Busque y agregue productos arriba
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item, idx) => (
                <Table.Tr key={item.productId}>
                  <Table.Td style={cellStyle}>{item.productName}</Table.Td>
                  <Table.Td style={cellRight}>
                    <NumberInput
                      value={item.quantity}
                      onChange={(v) => updateItemField(idx, 'quantity', Number(v) || 1)}
                      min={0.01}
                      size="xs"
                      style={{ width: 70 }}
                      hideControls
                    />
                  </Table.Td>
                  <Table.Td style={cellRight}>
                    <NumberInput
                      value={item.unitCost}
                      onChange={(v) => updateItemField(idx, 'unitCost', Number(v) || 0)}
                      min={0}
                      decimalScale={2}
                      prefix="$"
                      size="xs"
                      style={{ width: 100 }}
                      hideControls
                    />
                  </Table.Td>
                  <Table.Td style={cellRight}>
                    <NumberInput
                      value={item.taxRate}
                      onChange={(v) => updateItemField(idx, 'taxRate', Number(v) || 0)}
                      min={0}
                      max={100}
                      size="xs"
                      style={{ width: 60 }}
                      hideControls
                    />
                  </Table.Td>
                  <Table.Td style={cellRight}>{fmt(item.lineTotal)}</Table.Td>
                  <Table.Td style={cellStyle}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeItem(idx)}
                    >
                      X
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Totals */}
        <Box style={{ border: '1px solid #c0c4cc', borderRadius: 3, padding: '8px 12px', background: '#f8f9fa' }}>
          <Flex justify="flex-end" gap={24}>
            <Text size="sm">Subtotal: <Text span fw={700}>{fmt(subtotal)}</Text></Text>
            <Text size="sm">IVA: <Text span fw={700}>{fmt(taxTotal)}</Text></Text>
            <Text size="md" fw={700}>Total: <Text span c="blue.8" fw={700}>{fmt(total)}</Text></Text>
          </Flex>
        </Box>

        <Textarea
          label="Notas"
          placeholder="Observaciones de la compra..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting} color="blue">
            Registrar Compra
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
