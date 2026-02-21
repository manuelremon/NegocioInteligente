import { useEffect, useState } from 'react'
import {
  Button,
  ColorInput,
  Group,
  Modal,
  Stack,
  TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Category } from '@renderer/types/ipc'

interface CategoryFormModalProps {
  opened: boolean
  onClose: () => void
  category?: Category
  onSaved: () => void
}

interface CategoryFormValues {
  name: string
  color: string
}

const SWATCHES = [
  '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6',
  '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005',
  '#fd7e14', '#fa5252'
]

export default function CategoryFormModal({
  opened,
  onClose,
  category,
  onSaved
}: CategoryFormModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false)
  const isEdit = !!category

  const form = useForm<CategoryFormValues>({
    initialValues: {
      name: '',
      color: ''
    },
    validate: {
      name: (v) => (v.trim().length === 0 ? 'El nombre es requerido' : null)
    }
  })

  // Populate form on open
  useEffect(() => {
    if (opened) {
      if (category) {
        form.setValues({
          name: category.name,
          color: category.color ?? ''
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, category])

  const handleSubmit = async (values: CategoryFormValues): Promise<void> => {
    setSubmitting(true)
    try {
      const payload = {
        name: values.name.trim(),
        color: values.color.trim() || null
      }

      const res = isEdit
        ? await window.api.categories.update({ id: category!.id, ...payload })
        : await window.api.categories.create(payload)

      if (res.ok) {
        notifications.show({
          title: isEdit ? 'Categoria actualizada' : 'Categoria creada',
          message: `"${values.name}" fue ${isEdit ? 'actualizada' : 'creada'} exitosamente`,
          color: 'green'
        })
        onSaved()
      } else {
        notifications.show({
          title: 'Error',
          message: res.error ?? 'No se pudo guardar la categoria',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error de conexion al guardar la categoria',
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
      title={isEdit ? 'Editar Categoria' : 'Nueva Categoria'}
      size="sm"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nombre"
            placeholder="Nombre de la categoria"
            required
            {...form.getInputProps('name')}
          />

          <ColorInput
            label="Color (opcional)"
            placeholder="Elegir un color"
            swatches={SWATCHES}
            swatchesPerRow={6}
            format="hex"
            {...form.getInputProps('color')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Guardar Cambios' : 'Crear Categoria'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
