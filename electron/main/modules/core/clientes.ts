import type { ModuleDefinition } from '../types'
import { registerCustomerHandlers } from '../../ipc/customers'

export const clientesModule: ModuleDefinition = {
  id: 'clientes',
  name: 'Clientes',
  description: 'Gestion de clientes y cuentas corrientes',
  version: '1.0.0',
  tier: 'basico',
  isCore: true,
  navItems: [
    { id: 'clientes', label: 'Clientes', icon: '\uD83D\uDC65', path: '/clientes', shortcut: 'F3', keyCode: 'F3' }
  ],
  registerHandlers: registerCustomerHandlers,
  pageComponentId: 'clientes'
}
