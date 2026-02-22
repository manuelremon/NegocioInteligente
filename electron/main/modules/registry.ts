import type { ModuleDefinition } from './types'
import { ventasModule } from './core/ventas'
import { inventarioModule } from './core/inventario'
import { comprasModule } from './core/compras'
import { cajaModule } from './core/caja'
import { clientesModule } from './core/clientes'
import { reportesModule } from './core/reportes'

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // Core modules (always active)
  ventasModule,
  inventarioModule,
  comprasModule,
  cajaModule,
  clientesModule,
  reportesModule,

  // Addon modules (controlled by tier + enabled_modules)
  {
    id: 'tienda-nube',
    name: 'Tienda Nube',
    description: 'Sincroniza productos y pedidos con tu tienda online',
    version: '1.0.0',
    tier: 'pro',
    isCore: false,
    navItems: [
      { id: 'tienda-nube', label: 'Tienda Nube', icon: '\uD83D\uDECD\uFE0F', path: '/tienda-nube' }
    ],
    registerHandlers: () => {},
    pageComponentId: 'tienda-nube'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Envio de comprobantes y notificaciones por WhatsApp',
    version: '1.0.0',
    tier: 'pro',
    isCore: false,
    navItems: [
      { id: 'whatsapp', label: 'WhatsApp', icon: '\uD83D\uDCAC', path: '/whatsapp' }
    ],
    registerHandlers: () => {},
    pageComponentId: 'whatsapp'
  },
  {
    id: 'arca',
    name: 'ARCA (AFIP)',
    description: 'Facturacion electronica y comunicacion con AFIP',
    version: '1.0.0',
    tier: 'enterprise',
    isCore: false,
    navItems: [
      { id: 'arca', label: 'ARCA', icon: '\uD83C\uDFE6', path: '/arca' }
    ],
    registerHandlers: () => {},
    pageComponentId: 'arca'
  },
  {
    id: 'camaras',
    name: 'Camaras',
    description: 'Monitoreo de camaras de seguridad integrado',
    version: '1.0.0',
    tier: 'enterprise',
    isCore: false,
    navItems: [
      { id: 'camaras', label: 'Camaras', icon: '\uD83D\uDCF7', path: '/camaras' }
    ],
    registerHandlers: () => {},
    pageComponentId: 'camaras'
  },
  {
    id: 'multi-sucursal',
    name: 'Multi-sucursal',
    description: 'Gestion centralizada de multiples sucursales',
    version: '1.0.0',
    tier: 'enterprise',
    isCore: false,
    navItems: [
      { id: 'multi-sucursal', label: 'Sucursales', icon: '\uD83C\uDFE2', path: '/multi-sucursal' }
    ],
    registerHandlers: () => {},
    pageComponentId: 'multi-sucursal'
  }
]
