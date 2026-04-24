import { CompanyRepository } from '../../repositories/company.repository.ts'

export async function deleteCompany(id: string): Promise<void> {
  await CompanyRepository.delete(id)
}
