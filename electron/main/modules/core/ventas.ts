import type { ModuleDefinition } from '../types'
import { registerSalesHandlers } from '../../ipc/sales'

export const ventasModule: ModuleDefinition = {
  id: 'ventas',
  name: 'Ventas',
  description: 'Punto de venta',
  version: '1.0.0',
  tier: 'basico',
  isCore: true,
  navItems: [
    { id: 'ventas', label: 'Ventas', icon: '\uD83D\uDED2', path: '/ventas', shortcut: 'F6', keyCode: 'F6' }
  ],
  registerHandlers: registerSalesHandlers,
  pageComponentId: 'ventas'
}
