import { registerCategoryHandlers } from './categories'
import { registerProductHandlers } from './products'
import { registerSalesHandlers } from './sales'
import { registerCashHandlers } from './cash'
import { registerCustomerHandlers } from './customers'
import { registerReportHandlers } from './reports'
import { registerPurchaseHandlers } from './purchases'
import { registerSettingsHandlers } from './settings'

export {
  registerCategoryHandlers,
  registerProductHandlers,
  registerSalesHandlers,
  registerCashHandlers,
  registerCustomerHandlers,
  registerReportHandlers,
  registerPurchaseHandlers,
  registerSettingsHandlers
}

export function registerAllHandlers(): void {
  registerCategoryHandlers()
  registerProductHandlers()
  registerSalesHandlers()
  registerCashHandlers()
  registerCustomerHandlers()
  registerReportHandlers()
  registerPurchaseHandlers()
  registerSettingsHandlers()
}
