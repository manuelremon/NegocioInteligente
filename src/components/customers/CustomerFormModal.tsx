import { Modal, Stack, TextInput, NumberInput, Textarea, Group, Button } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useState, useEffect } from 'react'
import type { Customer } from '@renderer/types/ipc'

interface CustomerFormModalProps {
  opened: boolean
  onClose: () => void
  customer?: Customer
  onSaved: () => void
}

interface CustomerFormValues {
  name: string
  phone: string
  email: string
  address: string
  taxId: string
  creditLimit: number | ''
  notes: string
}

export default function CustomerFormModal({
  opened,
  onClose,
  customer,
  onSaved
}: CustomerFormModalProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const isEditing = !!customer

  const form = useForm<CustomerFormValues>({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      creditLimit: 0,
      notes: ''
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'El nombre es obligatorio' : null)
    }
  })

  useEffect(() => {
    if (opened) {
      if (customer) {
        form.setValues({
          name: customer.name,
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          taxId: customer.taxId || '',
          creditLimit: customer.creditLimit,
          notes: customer.notes || ''
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, customer])

  const handleSubmit = async (values: CustomerFormValues): Promise<void> => {
    setLoading(true)
    try {
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        address: values.address.trim() || null,
        taxId: values.taxId.trim() || null,
        creditLimit: (values.creditLimit as number) || 0,
        notes: values.notes.trim() || null
      }

      const result = isEditing
        ? await window.api.customers.update({ id: customer!.id, ...payload })
        : await window.api.customers.create(payload)

      if (result.ok) {
        notifications.show({
          title: isEditing ? 'Cliente actualizado' : 'Cliente creado',
          message: `${payload.name} fue ${isEditing ? 'actualizado' : 'creado'} correctamente`,
          color: 'green'
        })
        form.reset()
        onSaved()
        onClose()
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'No se pudo guardar el cliente',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al guardar el cliente',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (): void => {
    form.reset()
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nombre"
            placeholder="Nombre del cliente"
            required
            {...form.getInputProps('name')}
          />

          <Group grow>
            <TextInput
              label="Teléfono"
              placeholder="(011) 1234-5678"
              {...form.getInputProps('phone')}
            />
            <TextInput
              label="Email"
              placeholder="cliente@email.com"
              {...form.getInputProps('email')}
            />
          </Group>

          <TextInput
            label="Dirección"
            placeholder="Dirección del cliente"
            {...form.getInputProps('address')}
          />

          <Group grow>
            <TextInput
              label="CUIT / DNI"
              placeholder="20-12345678-9"
              {...form.getInputProps('taxId')}
            />
            <NumberInput
              label="Límite de crédito"
              placeholder="0.00"
              min={0}
              step={100}
              decimalScale={2}
              prefix="$ "
              thousandSeparator="."
              decimalSeparator=","
              {...form.getInputProps('creditLimit')}
            />
          </Group>

          <Textarea
            label="Notas"
            placeholder="Observaciones sobre el cliente"
            rows={3}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
