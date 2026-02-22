import type { ModuleDefinition } from '../types'
import { registerCashHandlers } from '../../ipc/cash'

export const cajaModule: ModuleDefinition = {
  id: 'caja',
  name: 'Caja',
  description: 'Apertura/cierre de caja y movimientos',
  version: '1.0.0',
  tier: 'basico',
  isCore: true,
  navItems: [
    { id: 'caja', label: 'Caja', icon: '\uD83D\uDCB0', path: '/caja', shortcut: 'F7', keyCode: 'F7' }
  ],
  registerHandlers: registerCashHandlers,
  pageComponentId: 'caja'
}
