import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Product, Category } from '@renderer/types/ipc'

interface ProductFormModalProps {
  opened: boolean
  onClose: () => void
  product?: Product
  onSaved: () => void
}

interface ProductFormValues {
  name: string
  categoryId: string | null
  barcode: string
  sku: string
  basePrice: number
  costPrice: number
  taxRate: number
  trackInventory: boolean
  stock: number
  minStock: number
}

export default function ProductFormModal({
  opened,
  onClose,
  product,
  onSaved
}: ProductFormModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const isEdit = !!product

  const form = useForm<ProductFormValues>({
    initialValues: {
      name: '',
      categoryId: null,
      barcode: '',
      sku: '',
      basePrice: 0,
      costPrice: 0,
      taxRate: 21,
      trackInventory: true,
      stock: 0,
      minStock: 0
    },
    validate: {
      name: (v) => (v.trim().length === 0 ? 'El nombre es requerido' : null),
      basePrice: (v) => (v < 0 ? 'El precio debe ser mayor o igual a 0' : null),
      costPrice: (v) => (v < 0 ? 'El costo debe ser mayor o igual a 0' : null),
      taxRate: (v) => (v < 0 ? 'La tasa de impuesto debe ser mayor o igual a 0' : null),
      stock: (v) => (v < 0 ? 'El stock debe ser mayor o igual a 0' : null),
      minStock: (v) => (v < 0 ? 'El stock minimo debe ser mayor o igual a 0' : null)
    }
  })

  // Load categories for the select
  useEffect(() => {
    if (opened) {
      window.api.categories.list().then((res) => {
        if (res.ok && res.data) setCategories(res.data)
      })
    }
  }, [opened])

  // Populate form when editing
  useEffect(() => {
    if (opened) {
      if (product) {
        form.setValues({
          name: product.name,
          categoryId: product.categoryId ? String(product.categoryId) : null,
          barcode: product.barcode ?? '',
          sku: product.sku ?? '',
          basePrice: product.basePrice,
          costPrice: product.costPrice,
          taxRate: product.taxRate,
          trackInventory: product.trackInventory,
          stock: product.stock,
          minStock: product.minStock
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, product])

  const categorySelectData = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories]
  )

  const handleSubmit = async (values: ProductFormValues): Promise<void> => {
    setSubmitting(true)
    try {
      const payload = {
        name: values.name.trim(),
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        barcode: values.barcode.trim() || null,
        sku: values.sku.trim() || null,
        basePrice: values.basePrice,
        costPrice: values.costPrice,
        taxRate: values.taxRate,
        trackInventory: values.trackInventory,
        stock: values.stock,
        minStock: values.minStock
      }

      const res = isEdit
        ? await window.api.products.update({ id: product!.id, ...payload })
        : await window.api.products.create(payload)

      if (res.ok) {
        notifications.show({
          title: isEdit ? 'Producto actualizado' : 'Producto creado',
          message: `"${values.name}" fue ${isEdit ? 'actualizado' : 'creado'} exitosamente`,
          color: 'green'
        })
        onSaved()
      } else {
        notifications.show({
          title: 'Error',
          message: res.error ?? 'No se pudo guardar el producto',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error de conexion al guardar el producto',
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
      title={isEdit ? 'Editar Producto' : 'Nuevo Producto'}
      size="lg"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nombre"
            placeholder="Nombre del producto"
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Categoria"
            placeholder="Seleccionar categoria"
            data={categorySelectData}
            clearable
            searchable
            {...form.getInputProps('categoryId')}
          />

          <Group grow>
            <TextInput
              label="Codigo de barras"
              placeholder="EAN / UPC"
              {...form.getInputProps('barcode')}
            />
            <TextInput
              label="SKU"
              placeholder="Codigo interno"
              {...form.getInputProps('sku')}
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Precio de venta"
              placeholder="0.00"
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
              thousandSeparator="."
              decimalSeparator=","
              {...form.getInputProps('basePrice')}
            />
            <NumberInput
              label="Precio de costo"
              placeholder="0.00"
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
              thousandSeparator="."
              decimalSeparator=","
              {...form.getInputProps('costPrice')}
            />
          </Group>

          <NumberInput
            label="Tasa de impuesto (%)"
            placeholder="21"
            min={0}
            max={100}
            decimalScale={2}
            suffix="%"
            style={{ maxWidth: 200 }}
            {...form.getInputProps('taxRate')}
          />

          <Switch
            label="Controlar inventario"
            description="Activar seguimiento de stock para este producto"
            {...form.getInputProps('trackInventory', { type: 'checkbox' })}
          />

          {form.values.trackInventory && (
            <Group grow>
              <NumberInput
                label={isEdit ? 'Stock actual' : 'Stock inicial'}
                placeholder="0"
                min={0}
                {...form.getInputProps('stock')}
              />
              <NumberInput
                label="Stock minimo"
                placeholder="0"
                min={0}
                {...form.getInputProps('minStock')}
              />
            </Group>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
