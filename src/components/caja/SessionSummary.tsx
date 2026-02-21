import { Card, SimpleGrid, Text, Paper, Stack } from '@mantine/core'
import type { RegisterSession } from '@renderer/types/ipc'

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

interface SessionSummaryProps {
  session: RegisterSession
}

interface StatCardProps {
  label: string
  value: string
  color?: string
}

function StatCard({ label, value, color }: StatCardProps): JSX.Element {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {label}
        </Text>
        <Text size="lg" fw={700} c={color}>
          {value}
        </Text>
      </Stack>
    </Paper>
  )
}

export default function SessionSummary({ session }: SessionSummaryProps): JSX.Element {
  const expectedFloat =
    session.openingFloat +
    session.cashSales -
    session.refunds +
    session.cashIn -
    session.cashOut

  return (
    <Card withBorder p="lg" radius="md">
      <Text fw={600} size="lg" mb="md">
        Resumen de Sesion Activa
      </Text>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <StatCard label="Monto inicial" value={formatCurrency(session.openingFloat)} />
        <StatCard label="Ventas efectivo" value={formatCurrency(session.cashSales)} color="green" />
        <StatCard label="Ventas tarjeta" value={formatCurrency(session.cardSales)} color="blue" />
        <StatCard
          label="Ventas fiado"
          value={formatCurrency(session.otherSales)}
          color="orange"
        />
        <StatCard label="Ingresos" value={formatCurrency(session.cashIn)} color="teal" />
        <StatCard label="Egresos" value={formatCurrency(session.cashOut)} color="red" />
        <StatCard label="Reembolsos" value={formatCurrency(session.refunds)} color="red" />
        <StatCard label="Saldo esperado" value={formatCurrency(expectedFloat)} color="violet" />
      </SimpleGrid>
    </Card>
  )
}
