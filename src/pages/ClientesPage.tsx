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
  LoadingOverlay,
  Paper
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

  const [formOpened, setFormOpened] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined)

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
          <Title order={3} c="#1e293b">Clientes</Title>
          <Button color="indigo" radius="md" onClick={handleNewCustomer}>
            Nuevo Cliente
          </Button>
        </Group>

        {/* Search */}
        <TextInput
          placeholder="Buscar por nombre, telefono o email..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ maxWidth: 400 }}
          radius="md"
          size="sm"
        />

        {/* Table */}
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={loading} />

          {customers.length === 0 && !loading ? (
            <Text c="dimmed" ta="center" py="xl">
              {debouncedSearch
                ? 'No se encontraron clientes con esa busqueda'
                : 'No hay clientes registrados. Crea uno nuevo para comenzar.'}
            </Text>
          ) : (
            <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead>
                  <Table.Tr style={{ background: '#f8fafc' }}>
                    <Table.Th><Text size="xs" c="#64748b" fw={600}>Nombre</Text></Table.Th>
                    <Table.Th><Text size="xs" c="#64748b" fw={600}>Telefono</Text></Table.Th>
                    <Table.Th ta="right"><Text size="xs" c="#64748b" fw={600}>Saldo</Text></Table.Th>
                    <Table.Th ta="right"><Text size="xs" c="#64748b" fw={600}>Limite de Credito</Text></Table.Th>
                    <Table.Th><Text size="xs" c="#64748b" fw={600}>Estado</Text></Table.Th>
                    <Table.Th><Text size="xs" c="#64748b" fw={600}>Acciones</Text></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {customers.map((customer) => (
                    <Table.Tr key={customer.id}>
                      <Table.Td>
                        <Text fw={500} size="sm">{customer.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="#64748b">{customer.phone || '-'}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        {customer.currentBalance > 0 ? (
                          <Badge color="red" variant="light" size="lg" radius="md">
                            {formatCurrency(customer.currentBalance)}
                          </Badge>
                        ) : (
                          <Text size="sm" c="green" fw={500}>
                            {formatCurrency(0)}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm" c="#64748b">{formatCurrency(customer.creditLimit)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={customer.isActive ? 'green' : 'gray'}
                          variant="light"
                          size="sm"
                          radius="md"
                        >
                          {customer.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            variant="light"
                            color="indigo"
                            size="xs"
                            radius="md"
                            onClick={() => handleViewDetail(customer.id)}
                          >
                            Ver Detalle
                          </Button>
                          <Button
                            variant="subtle"
                            size="xs"
                            radius="md"
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
            </Paper>
          )}
        </div>

        {/* Results count */}
        {customers.length > 0 && (
          <Paper withBorder radius="md" p="xs" px="md" bg="#f8fafc">
            <Text size="xs" fw={500} c="#64748b">
              {customers.length} cliente(s)
            </Text>
          </Paper>
        )}
      </Stack>

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
