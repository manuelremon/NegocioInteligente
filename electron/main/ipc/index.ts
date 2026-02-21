import { registerCategoryHandlers } from './categories'
import { registerProductHandlers } from './products'
import { registerSalesHandlers } from './sales'
import { registerCashHandlers } from './cash'
import { registerCustomerHandlers } from './customers'
import { registerReportHandlers } from './reports'

export function registerAllHandlers(): void {
  registerCategoryHandlers()
  registerProductHandlers()
  registerSalesHandlers()
  registerCashHandlers()
  registerCustomerHandlers()
  registerReportHandlers()
}
