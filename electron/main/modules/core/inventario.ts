import type { ModuleDefinition } from '../types'
import { registerProductHandlers } from '../../ipc/products'
import { registerCategoryHandlers } from '../../ipc/categories'

export const inventarioModule: ModuleDefinition = {
  id: 'inventario',
  name: 'Inventario',
  description: 'Gestion de productos, categorias y stock',
  version: '1.0.0',
  tier: 'basico',
  isCore: true,
  navItems: [
    { id: 'inventario', label: 'Inventario', icon: '\uD83D\uDCE6', path: '/inventario', shortcut: 'F5', keyCode: 'F5' }
  ],
  registerHandlers: () => {
    registerCategoryHandlers()
    registerProductHandlers()
  },
  pageComponentId: 'inventario'
}
