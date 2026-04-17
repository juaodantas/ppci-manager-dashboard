import { Customer } from '../../../_shared/domain/entities/customer.entity.ts'
import { CustomerRepository, CustomerWithCounts } from '../../repositories/customer.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllCustomers(
  limit: number,
  offset: number,
  search?: string,
): Promise<{ data: Customer[]; total: number; limit: number; offset: number }> {
  const { customers, total } = await CustomerRepository.findAll(limit, offset, search)
  return { data: customers, total, limit, offset }
}

export async function getCustomerById(id: string): Promise<CustomerWithCounts> {
  const customer = await CustomerRepository.findById(id)
  if (!customer) throw notFound('Customer', id)
  return customer
}
