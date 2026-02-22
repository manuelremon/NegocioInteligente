import type { RendererModuleDefinition } from '@renderer/types/ipc'

export const RENDERER_MODULE_REGISTRY: RendererModuleDefinition[] = [
  // Core modules
  {
    id: 'ventas',
    name: 'Ventas',
    description: 'Punto de venta',
    version: '1.0.0',
    tier: 'basico',
    isCore: true,
    navItems: [
      { id: 'ventas', label: 'Ventas', icon: '\uD83D\uDED2', path: '/ventas', shortcut: 'F6', keyCode: 'F6' }
    ],
    pageComponentId: 'ventas'
  },
  {
    id: 'inventario',
    name: 'Inventario',
    description: 'Gestion de productos, categorias y stock',
    version: '1.0.0',
    tier: 'basico',
    isCore: true,
    navItems: [
      { id: 'inventario', label: 'Inventario', icon: '\uD83D\uDCE6', path: '/inventario', shortcut: 'F5', keyCode: 'F5' }
    ],
    pageComponentId: 'inventario'
  },
  {
    id: 'compras',
    name: 'Compras',
    description: 'Gestion de compras y proveedores',
    version: '1.0.0',
    tier: 'basico',
    isCore: true,
    navItems: [
      { id: 'compras', label: 'Compras', icon: '\uD83D\uDED2', path: '/compras', shortcut: 'F4', keyCode: 'F4' }
    ],
    pageComponentId: 'compras'
  },
  {
    id: 'caja',
    name: 'Caja',
    description: 'Apertura/cierre de caja y movimientos',
    version: '1.0.0',
    tier: 'basico',
    isCore: true,
    navItems: [
      { id: 'caja', label: 'Caja', icon: '\uD83D\uDCB0', path: '/caja', shortcut: 'F7', keyCode: 'F7' }
    ],
    pageComponentId: 'caja'
  },
  {
    id: 'clientes',
    name: 'Clientes',
    description: 'Gestion de clientes y cuentas corrientes',
    version: '1.0.0',
    tier: 'basico',
    isCore: true,
    navItems: [
      { id: 'clientes', label: 'Clientes', icon: '\uD83D\uDC65', path: '/clientes', shortcut: 'F3', keyCode: 'F3' }
    ],
    pageComponentId: 'clientes'
  },
  {
    id: 'reportes',
    name: 'Reportes',
    description: 'Reportes de ventas, inventario y finanzas',
    version: '1.0.0',
    tier: 'basico',
    isCore: true,
    navItems: [
      { id: 'reportes', label: 'Reportes', icon: '\uD83D\uDCCA', path: '/reportes', shortcut: 'F8', keyCode: 'F8' }
    ],
    pageComponentId: 'reportes'
  },

  // Addon modules
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
    pageComponentId: 'multi-sucursal'
  }
]
