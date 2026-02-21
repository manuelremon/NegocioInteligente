import { useState } from 'react'
import { Stack, Group, Tabs, Paper, Flex, Text } from '@mantine/core'
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
    <Stack gap="xs" style={{ height: '100%' }}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Flex justify="space-between" align="end" wrap="wrap" gap="xs">
          <Tabs.List>
            <Tabs.Tab value="ventas" style={{ fontWeight: 600 }}>Ventas</Tabs.Tab>
            <Tabs.Tab value="top-productos" style={{ fontWeight: 600 }}>Top Productos</Tabs.Tab>
            <Tabs.Tab value="inventario" style={{ fontWeight: 600 }}>Inventario</Tabs.Tab>
            <Tabs.Tab value="deudores" style={{ fontWeight: 600 }}>Deudores</Tabs.Tab>
            <Tabs.Tab value="caja" style={{ fontWeight: 600 }}>Caja</Tabs.Tab>
          </Tabs.List>

          <Paper p="xs" withBorder style={{ background: '#f5f6f8' }}>
            <Group gap="xs">
              <Text size="xs" fw={600}>Periodo:</Text>
              <DatePickerInput
                placeholder="Desde"
                value={from}
                onChange={setFrom}
                maxDate={to ?? undefined}
                clearable={false}
                size="xs"
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
                style={{ width: 140 }}
              />
            </Group>
          </Paper>
        </Flex>

        <Tabs.Panel value="ventas" pt="xs">
          <SalesReport from={fromStr} to={toStr} />
        </Tabs.Panel>

        <Tabs.Panel value="top-productos" pt="xs">
          <TopProductsReport from={fromStr} to={toStr} />
        </Tabs.Panel>

        <Tabs.Panel value="inventario" pt="xs">
          <InventoryReport />
        </Tabs.Panel>

        <Tabs.Panel value="deudores" pt="xs">
          <DebtorsReport />
        </Tabs.Panel>

        <Tabs.Panel value="caja" pt="xs">
          <CashReport from={fromStr} to={toStr} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
