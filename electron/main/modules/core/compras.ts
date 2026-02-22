import type { ModuleDefinition } from '../types'
import { registerPurchaseHandlers } from '../../ipc/purchases'

export const comprasModule: ModuleDefinition = {
  id: 'compras',
  name: 'Compras',
  description: 'Gestion de compras y proveedores',
  version: '1.0.0',
  tier: 'basico',
  isCore: true,
  navItems: [
    { id: 'compras', label: 'Compras', icon: '\uD83D\uDED2', path: '/compras', shortcut: 'F4', keyCode: 'F4' }
  ],
  registerHandlers: registerPurchaseHandlers,
  pageComponentId: 'compras'
}
