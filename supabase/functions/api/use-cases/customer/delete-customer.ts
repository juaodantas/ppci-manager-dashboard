import { CustomerRepository } from '../../repositories/customer.repository.ts'
import { notFound } from '../../errors.ts'

export async function deleteCustomer(id: string): Promise<void> {
  const customer = await CustomerRepository.findById(id)
  if (!customer) throw notFound('Customer', id)
  await CustomerRepository.softDelete(id)
}
