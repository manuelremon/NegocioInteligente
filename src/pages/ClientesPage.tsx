import { useState, useEffect, useCallback } from 'react'
import {
  Stack,
  Group,
  Title,
  TextInput,
  Button,
  Table,
  Text,
  Badge,
  LoadingOverlay
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import type { Customer } from '@renderer/types/ipc'
import CustomerFormModal from '@renderer/components/customers/CustomerFormModal'
import CustomerDetail from '@renderer/components/customers/CustomerDetail'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

export default function ClientesPage(): JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)

  // Form modal state
  const [formOpened, setFormOpened] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined)

  // Detail drawer state
  const [detailOpened, setDetailOpened] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const filters = debouncedSearch ? { search: debouncedSearch } : undefined
      const result = await window.api.customers.list(filters)
      if (result.ok && result.data) {
        setCustomers(result.data as Customer[])
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'No se pudieron cargar los clientes',
          color: 'red'
        })
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Error inesperado al cargar clientes',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleNewCustomer = (): void => {
    setEditingCustomer(undefined)
    setFormOpened(true)
  }

  const handleEditCustomer = (customer: Customer): void => {
    setEditingCustomer(customer)
    setFormOpened(true)
  }

  const handleViewDetail = (customerId: number): void => {
    setSelectedCustomerId(customerId)
    setDetailOpened(true)
  }

  const handleFormSaved = (): void => {
    fetchCustomers()
  }

  return (
    <>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Title order={2}>Clientes</Title>
          <Button onClick={handleNewCustomer}>Nuevo Cliente</Button>
        </Group>

        {/* Search */}
        <TextInput
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ maxWidth: 400 }}
        />

        {/* Table */}
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={loading} />

          {customers.length === 0 && !loading ? (
            <Text c="dimmed" ta="center" py="xl">
              {debouncedSearch
                ? 'No se encontraron clientes con esa búsqueda'
                : 'No hay clientes registrados. Creá uno nuevo para comenzar.'}
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Teléfono</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Saldo</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Límite de Crédito</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {customers.map((customer) => (
                  <Table.Tr key={customer.id}>
                    <Table.Td>
                      <Text fw={500}>{customer.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{customer.phone || '-'}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      {customer.currentBalance > 0 ? (
                        <Badge color="red" variant="light" size="lg">
                          {formatCurrency(customer.currentBalance)}
                        </Badge>
                      ) : (
                        <Text size="sm" c="green" fw={500}>
                          {formatCurrency(0)}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text size="sm">{formatCurrency(customer.creditLimit)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={customer.isActive ? 'green' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {customer.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          variant="light"
                          size="xs"
                          onClick={() => handleViewDetail(customer.id)}
                        >
                          Ver Detalle
                        </Button>
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          Editar
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </div>
      </Stack>

      {/* Modals & Drawers */}
      <CustomerFormModal
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        customer={editingCustomer}
        onSaved={handleFormSaved}
      />

      <CustomerDetail
        opened={detailOpened}
        onClose={() => setDetailOpened(false)}
        customerId={selectedCustomerId}
      />
    </>
  )
}
