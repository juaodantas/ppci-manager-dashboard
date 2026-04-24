import { Company } from '../../../_shared/domain/entities/company.entity.ts'
import { CompanyRepository } from '../../repositories/company.repository.ts'
import { notFound } from '../../errors.ts'
import { CompanyUpdateDto } from '../../validation/schemas.ts'

export async function updateCompany(id: string, dto: CompanyUpdateDto): Promise<Company> {
  const updated = await CompanyRepository.update(id, {
    name: dto.name,
    cnpj: dto.cnpj,
    responsible: dto.responsible,
    type: dto.type,
  })
  if (!updated) throw notFound('Company', id)
  return updated
}
