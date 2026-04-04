import { Customer } from '../../../_shared/domain/entities/customer.entity.ts'
import { CustomerRepository } from '../../repositories/customer.repository.ts'
import { badRequest } from '../../errors.ts'
import { CreateCustomerDto } from '../../validation/schemas.ts'

export async function createCustomer(dto: CreateCustomerDto): Promise<Customer> {
  // RN03: email ou phone é obrigatório
  if (!dto.email && !dto.phone) {
    throw badRequest('email ou phone é obrigatório')
  }

  return CustomerRepository.save({
    name: dto.name,
    document: dto.document,
    email: dto.email,
    phone: dto.phone,
  })
}
