// Entities
export { User, type UserProps } from './entities/user.entity.ts'
export { type Customer, isDeleted as isCustomerDeleted } from './entities/customer.entity.ts'
export {
  type ServiceCategory,
  type ServiceCatalogItem,
  type ServicePrice,
  type ServiceCatalogWithCategory,
} from './entities/service-catalog.entity.ts'
export { type QuoteStatus, type QuoteItem, type Quote } from './entities/quote.entity.ts'
export {
  type ProjectStatus,
  type ProjectService,
  type Project,
} from './entities/project.entity.ts'
export { type PaymentStatus, type Payment } from './entities/payment.entity.ts'
export { type FixedCost } from './entities/fixed-cost.entity.ts'
export { type VariableCost } from './entities/variable-cost.entity.ts'
export {
  type EntryType,
  type EntrySourceType,
  type FinancialEntry,
  type FinancialReport,
} from './entities/financial-entry.entity.ts'

// Value Objects
export { Email } from './value-objects/email.vo.ts'

// Exceptions
export {
  DomainException,
  InvalidEmailException,
  EntityNotFoundException,
  DuplicateEmailException,
} from './exceptions/domain.exception.ts'
