import type { Customer } from '@manager/domain'
import type {
  ICustomerRepository,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerWithCounts,
} from '../../../domain/repositories/customer.repository'

export class GetCustomersUseCase {
  constructor(private readonly repo: ICustomerRepository) {}
  execute(params: { limit: number; offset: number }): Promise<{ customers: Customer[]; total: number }> {
    return this.repo.findAll(params)
  }
}

export class GetCustomerUseCase {
  constructor(private readonly repo: ICustomerRepository) {}
  execute(id: string): Promise<CustomerWithCounts> {
    return this.repo.findById(id)
  }
}

export class CreateCustomerUseCase {
  constructor(private readonly repo: ICustomerRepository) {}
  execute(data: CreateCustomerDto): Promise<Customer> {
    return this.repo.create(data)
  }
}

export class UpdateCustomerUseCase {
  constructor(private readonly repo: ICustomerRepository) {}
  execute(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return this.repo.update(id, data)
  }
}

export class DeleteCustomerUseCase {
  constructor(private readonly repo: ICustomerRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}
