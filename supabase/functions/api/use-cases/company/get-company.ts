import { Company, CompanyType } from '../../../_shared/domain/entities/company.entity.ts'
import { CompanyRepository } from '../../repositories/company.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllCompanies(
  params: { type?: CompanyType; limit: number; offset: number },
): Promise<{ data: Company[]; total: number; limit: number; offset: number }> {
  const { companies, total } = await CompanyRepository.findAll(params)
  return { data: companies, total, limit: params.limit, offset: params.offset }
}

export async function getCompanyById(id: string): Promise<Company> {
  const company = await CompanyRepository.findById(id)
  if (!company) throw notFound('Company', id)
  return company
}
