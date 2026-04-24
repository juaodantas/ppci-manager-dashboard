import { Company } from '../../../_shared/domain/entities/company.entity.ts'
import { CompanyRepository } from '../../repositories/company.repository.ts'
import { CompanyCreateDto } from '../../validation/schemas.ts'

export async function createCompany(dto: CompanyCreateDto): Promise<Company> {
  return CompanyRepository.save({
    name: dto.name,
    cnpj: dto.cnpj,
    responsible: dto.responsible,
    type: dto.type,
  })
}
