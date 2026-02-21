import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingOverlay } from '@mantine/core'
import AppShell from './components/AppShell'

const VentasPage = lazy(() => import('./pages/VentasPage'))
const InventarioPage = lazy(() => import('./pages/InventarioPage'))
const CajaPage = lazy(() => import('./pages/CajaPage'))
const ClientesPage = lazy(() => import('./pages/ClientesPage'))
const ReportesPage = lazy(() => import('./pages/ReportesPage'))

function App(): JSX.Element {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/ventas" replace />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/caja" element={<CajaPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
