import { useState } from 'react'
import { Stack, Group, Tabs, Paper, Flex, Text, Title } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import dayjs from 'dayjs'

import SalesReport from '@renderer/components/reports/SalesReport'
import TopProductsReport from '@renderer/components/reports/TopProductsReport'
import InventoryReport from '@renderer/components/reports/InventoryReport'
import DebtorsReport from '@renderer/components/reports/DebtorsReport'
import CashReport from '@renderer/components/reports/CashReport'

export default function ReportesPage(): JSX.Element {
  const [from, setFrom] = useState<Date | null>(dayjs().subtract(30, 'day').toDate())
  const [to, setTo] = useState<Date | null>(dayjs().toDate())
  const [activeTab, setActiveTab] = useState<string | null>('ventas')

  const fromStr = from ? dayjs(from).format('YYYY-MM-DD') : dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  const toStr = to ? dayjs(to).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')

  return (
    <Stack gap="md" style={{ height: '100%' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
        <Title order={3} c="#1e293b">Reportes</Title>
        <Paper withBorder p="xs" px="md" radius="md" bg="white">
          <Group gap="sm">
            <Text size="xs" fw={600} c="#64748b">Periodo:</Text>
            <DatePickerInput
              placeholder="Desde"
              value={from}
              onChange={setFrom}
              maxDate={to ?? undefined}
              clearable={false}
              size="xs"
              radius="md"
              style={{ width: 140 }}
            />
            <DatePickerInput
              placeholder="Hasta"
              value={to}
              onChange={setTo}
              minDate={from ?? undefined}
              maxDate={new Date()}
              clearable={false}
              size="xs"
              radius="md"
              style={{ width: 140 }}
            />
          </Group>
        </Paper>
      </Flex>

      <Tabs value={activeTab} onChange={setActiveTab} radius="md">
        <Tabs.List>
          <Tabs.Tab value="ventas" style={{ fontWeight: 600, fontSize: 13 }}>Ventas</Tabs.Tab>
          <Tabs.Tab value="top-productos" style={{ fontWeight: 600, fontSize: 13 }}>Top Productos</Tabs.Tab>
          <Tabs.Tab value="inventario" style={{ fontWeight: 600, fontSize: 13 }}>Inventario</Tabs.Tab>
          <Tabs.Tab value="deudores" style={{ fontWeight: 600, fontSize: 13 }}>Deudores</Tabs.Tab>
          <Tabs.Tab value="caja" style={{ fontWeight: 600, fontSize: 13 }}>Caja</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="ventas" pt="md">
          <SalesReport from={fromStr} to={toStr} />
        </Tabs.Panel>

        <Tabs.Panel value="top-productos" pt="md">
          <TopProductsReport from={fromStr} to={toStr} />
        </Tabs.Panel>

        <Tabs.Panel value="inventario" pt="md">
          <InventoryReport />
        </Tabs.Panel>

        <Tabs.Panel value="deudores" pt="md">
          <DebtorsReport />
        </Tabs.Panel>

        <Tabs.Panel value="caja" pt="md">
          <CashReport from={fromStr} to={toStr} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
