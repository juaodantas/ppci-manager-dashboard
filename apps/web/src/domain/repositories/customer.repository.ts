import type { Customer } from '@manager/domain'

export interface CreateCustomerDto {
  name: string
  document?: string
  email?: string
  phone?: string
}

export interface UpdateCustomerDto {
  name?: string
  document?: string
  email?: string
  phone?: string
}

export interface CustomerWithCounts extends Customer {
  quote_count: number
  project_count: number
}

export interface ICustomerRepository {
  findAll(params: {
    limit: number
    offset: number
    search?: string
  }): Promise<{ customers: Customer[]; total: number }>
  findById(id: string): Promise<CustomerWithCounts>
  create(data: CreateCustomerDto): Promise<Customer>
  update(id: string, data: UpdateCustomerDto): Promise<Customer>
  delete(id: string): Promise<void>
}
