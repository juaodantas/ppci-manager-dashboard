import { LocalStorageToken } from '../storage/local-storage-token'
import { createAxiosInstance } from '../http/axios-instance'
import { AuthHttpRepository } from '../http/auth.http-repository'
import { UserHttpRepository } from '../http/user.http-repository'
import { CustomerHttpRepository } from '../http/customer.http-repository'
import { ServiceCatalogHttpRepository } from '../http/service-catalog.http-repository'
import { QuoteHttpRepository } from '../http/quote.http-repository'
import { ProjectHttpRepository } from '../http/project.http-repository'
import { PaymentHttpRepository } from '../http/payment.http-repository'
import { FixedCostHttpRepository } from '../http/fixed-cost.http-repository'
import { FinancialHttpRepository } from '../http/financial.http-repository'
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case'
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case'
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case'
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case'
import { GetUsersUseCase } from '../../application/use-cases/user/get-users.use-case'
import { CreateUserUseCase } from '../../application/use-cases/user/create-user.use-case'
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case'
import { DeleteUserUseCase } from '../../application/use-cases/user/delete-user.use-case'
import {
  GetCustomersUseCase,
  GetCustomerUseCase,
  CreateCustomerUseCase,
  UpdateCustomerUseCase,
  DeleteCustomerUseCase,
} from '../../application/use-cases/customer/customer.use-cases'
import {
  GetServiceCatalogUseCase,
  CreateServiceCatalogUseCase,
  UpdateServiceCatalogUseCase,
  DeactivateServiceUseCase,
  AddServicePriceUseCase,
} from '../../application/use-cases/service-catalog/service-catalog.use-cases'
import {
  GetQuotesUseCase,
  GetQuoteUseCase,
  CreateQuoteUseCase,
  UpdateQuoteUseCase,
  DeleteQuoteUseCase,
  ApproveQuoteUseCase,
} from '../../application/use-cases/quote/quote.use-cases'
import {
  GetProjectsUseCase,
  GetProjectUseCase,
  CreateProjectUseCase,
  UpdateProjectUseCase,
  AddProjectServiceUseCase,
  UpdateProjectServiceUseCase,
  RemoveProjectServiceUseCase,
  DeleteProjectUseCase,
} from '../../application/use-cases/project/project.use-cases'
import {
  GetPaymentsUseCase,
  CreatePaymentUseCase,
  PayPaymentUseCase,
} from '../../application/use-cases/payment/payment.use-cases'
import {
  GetFixedCostsUseCase,
  CreateFixedCostUseCase,
  UpdateFixedCostUseCase,
  DeleteFixedCostUseCase,
} from '../../application/use-cases/fixed-cost/fixed-cost.use-cases'
import {
  GetFinancialEntriesUseCase,
  GetFinancialReportUseCase,
} from '../../application/use-cases/financial/financial.use-cases'

const tokenStorage = new LocalStorageToken()

const authRepoRef: { repo: AuthHttpRepository | null } = { repo: null }

const http = createAxiosInstance(tokenStorage, () => {
  const refreshUseCase = new RefreshTokenUseCase(authRepoRef.repo!, tokenStorage)
  return refreshUseCase.execute()
})

authRepoRef.repo = new AuthHttpRepository(http)
const authRepo = authRepoRef.repo
const userRepo = new UserHttpRepository(http)
const customerRepo = new CustomerHttpRepository(http)
const serviceCatalogRepo = new ServiceCatalogHttpRepository(http)
const quoteRepo = new QuoteHttpRepository(http)
const projectRepo = new ProjectHttpRepository(http)
const paymentRepo = new PaymentHttpRepository(http)
const fixedCostRepo = new FixedCostHttpRepository(http)
const financialRepo = new FinancialHttpRepository(http)

export const container = {
  tokenStorage,

  auth: {
    login: new LoginUseCase(authRepo, tokenStorage),
    register: new RegisterUseCase(authRepo, tokenStorage),
    logout: new LogoutUseCase(authRepo, tokenStorage),
    refresh: new RefreshTokenUseCase(authRepo, tokenStorage),
  },

  user: new GetUsersUseCase(userRepo),
  createUser: new CreateUserUseCase(userRepo),
  updateUser: new UpdateUserUseCase(userRepo),
  deleteUser: new DeleteUserUseCase(userRepo),

  customers: {
    list: new GetCustomersUseCase(customerRepo),
    get: new GetCustomerUseCase(customerRepo),
    create: new CreateCustomerUseCase(customerRepo),
    update: new UpdateCustomerUseCase(customerRepo),
    delete: new DeleteCustomerUseCase(customerRepo),
  },

  serviceCatalog: {
    list: new GetServiceCatalogUseCase(serviceCatalogRepo),
    create: new CreateServiceCatalogUseCase(serviceCatalogRepo),
    update: new UpdateServiceCatalogUseCase(serviceCatalogRepo),
    deactivate: new DeactivateServiceUseCase(serviceCatalogRepo),
    addPrice: new AddServicePriceUseCase(serviceCatalogRepo),
  },

  quotes: {
    list: new GetQuotesUseCase(quoteRepo),
    get: new GetQuoteUseCase(quoteRepo),
    create: new CreateQuoteUseCase(quoteRepo),
    update: new UpdateQuoteUseCase(quoteRepo),
    delete: new DeleteQuoteUseCase(quoteRepo),
    approve: new ApproveQuoteUseCase(quoteRepo),
  },

  projects: {
    list: new GetProjectsUseCase(projectRepo),
    get: new GetProjectUseCase(projectRepo),
    create: new CreateProjectUseCase(projectRepo),
    update: new UpdateProjectUseCase(projectRepo),
    addService: new AddProjectServiceUseCase(projectRepo),
    updateService: new UpdateProjectServiceUseCase(projectRepo),
    removeService: new RemoveProjectServiceUseCase(projectRepo),
    delete: new DeleteProjectUseCase(projectRepo),
  },

  payments: {
    list: new GetPaymentsUseCase(paymentRepo),
    create: new CreatePaymentUseCase(paymentRepo),
    pay: new PayPaymentUseCase(paymentRepo),
  },

  fixedCosts: {
    list: new GetFixedCostsUseCase(fixedCostRepo),
    create: new CreateFixedCostUseCase(fixedCostRepo),
    update: new UpdateFixedCostUseCase(fixedCostRepo),
    delete: new DeleteFixedCostUseCase(fixedCostRepo),
  },

  financial: {
    entries: new GetFinancialEntriesUseCase(financialRepo),
    report: new GetFinancialReportUseCase(financialRepo),
  },
}
