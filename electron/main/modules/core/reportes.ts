import type { ModuleDefinition } from '../types'
import { registerReportHandlers } from '../../ipc/reports'

export const reportesModule: ModuleDefinition = {
  id: 'reportes',
  name: 'Reportes',
  description: 'Reportes de ventas, inventario y finanzas',
  version: '1.0.0',
  tier: 'basico',
  isCore: true,
  navItems: [
    { id: 'reportes', label: 'Reportes', icon: '\uD83D\uDCCA', path: '/reportes', shortcut: 'F8', keyCode: 'F8' }
  ],
  registerHandlers: registerReportHandlers,
  pageComponentId: 'reportes'
}
