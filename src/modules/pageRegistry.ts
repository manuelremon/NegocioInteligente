import { lazy, type LazyExoticComponent } from 'react'

type PageComponent = LazyExoticComponent<() => JSX.Element>

export const PAGE_COMPONENTS: Record<string, PageComponent> = {
  ventas: lazy(() => import('@renderer/pages/VentasPage')),
  inventario: lazy(() => import('@renderer/pages/InventarioPage')),
  compras: lazy(() => import('@renderer/pages/ComprasPage')),
  caja: lazy(() => import('@renderer/pages/CajaPage')),
  clientes: lazy(() => import('@renderer/pages/ClientesPage')),
  reportes: lazy(() => import('@renderer/pages/ReportesPage')),
  configuracion: lazy(() => import('@renderer/pages/ConfiguracionPage')),

  // Addon pages
  'tienda-nube': lazy(() => import('@renderer/pages/addons/TiendaNubePage')),
  whatsapp: lazy(() => import('@renderer/pages/addons/WhatsAppPage')),
  arca: lazy(() => import('@renderer/pages/addons/ArcaPage')),
  camaras: lazy(() => import('@renderer/pages/addons/CamarasPage')),
  'multi-sucursal': lazy(() => import('@renderer/pages/addons/MultiSucursalPage'))
}
