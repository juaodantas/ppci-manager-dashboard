// Entities
export { User, type UserProps } from './entities/user.entity.ts'
export {
  Service,
  TipoServico,
  StatusServico,
  StatusCronograma,
  StatusPagamento,
  TipoDocumento,
  CategoriaCusto,
  FormaPagamento,
  type ClienteInfo,
  type CronogramaItem,
  type PagamentoItem,
  type DocumentoItem,
  type CustoFixoItem,
  type ParcelamentoItem,
  type ServiceStats,
} from './entities/service.entity.ts'

// Value Objects
export { Email } from './value-objects/email.vo.ts'

// Exceptions
export {
  DomainException,
  InvalidEmailException,
  EntityNotFoundException,
  DuplicateEmailException,
} from './exceptions/domain.exception.ts'
