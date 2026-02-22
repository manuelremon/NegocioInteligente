import { useEffect, useState } from 'react'
import { Button, Group, Modal, Stack, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Supplier } from '@renderer/types/ipc'

interface SupplierFormModalProps {
  opened: boolean
  onClose: () => void
  supplier?: Supplier
  onSaved: () => void
}

interface SupplierFormValues {
  name: string
  phone: string
  email: string
  address: string
  taxId: string
  notes: string
}

export default function SupplierFormModal({
  opened,
  onClose,
  supplier,
  onSaved
}: SupplierFormModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false)
  const isEdit = !!supplier

  const form = useForm<SupplierFormValues>({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      notes: ''
    },
    validate: {
      name: (v) => (v.trim().length === 0 ? 'El nombre es requerido' : null)
    }
  })

  useEffect(() => {
    if (opened) {
      if (supplier) {
        form.setValues({
          name: supplier.name,
          phone: supplier.phone ?? '',
          email: supplier.email ?? '',
          address: supplier.address ?? '',
          taxId: supplier.taxId ?? '',
          notes: supplier.notes ?? ''
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, supplier])

  const handleSubmit = async (values: SupplierFormValues): Promise<void> => {
    setSubmitting(true)
    try {
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        address: values.address.trim() || null,
        taxId: values.taxId.trim() || null,
        notes: values.notes.trim() || null
      }

      const res = isEdit
        ? await window.api.purchases.updateSupplier({ id: supplier!.id, ...payload })
        : await window.api.purchases.createSupplier(payload)

      if (res.ok) {
        notifications.show({
          title: isEdit ? 'Proveedor actualizado' : 'Proveedor creado',
          message: `"${values.name}" fue ${isEdit ? 'actualizado' : 'creado'} exitosamente`,
          color: 'green'
        })
        onSaved()
      } else {
        notifications.show({
          title: 'Error',
          message: res.error ?? 'No se pudo guardar el proveedor',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error de conexion al guardar el proveedor',
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
      title={isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      size="md"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nombre"
            placeholder="Nombre del proveedor"
            required
            {...form.getInputProps('name')}
          />

          <Group grow>
            <TextInput
              label="Telefono"
              placeholder="Ej: 011-4444-5555"
              {...form.getInputProps('phone')}
            />
            <TextInput
              label="Email"
              placeholder="proveedor@ejemplo.com"
              {...form.getInputProps('email')}
            />
          </Group>

          <TextInput
            label="CUIT / RUT / Tax ID"
            placeholder="Ej: 20-12345678-9"
            {...form.getInputProps('taxId')}
          />

          <TextInput
            label="Direccion"
            placeholder="Direccion del proveedor"
            {...form.getInputProps('address')}
          />

          <Textarea
            label="Notas"
            placeholder="Observaciones..."
            rows={3}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
