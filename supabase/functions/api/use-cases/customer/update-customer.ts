import { Customer } from '../../../_shared/domain/entities/customer.entity.ts'
import { CustomerRepository } from '../../repositories/customer.repository.ts'
import { notFound } from '../../errors.ts'
import { UpdateCustomerDto } from '../../validation/schemas.ts'

export async function updateCustomer(id: string, dto: UpdateCustomerDto): Promise<Customer> {
  const updated = await CustomerRepository.update(id, {
    name: dto.name,
    document: dto.document,
    email: dto.email,
    phone: dto.phone,
  })
  if (!updated) throw notFound('Customer', id)
  return updated
}
