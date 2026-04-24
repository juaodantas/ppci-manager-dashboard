import type { Company, CompanyType } from '@manager/domain'

export interface CreateCompanyDto {
  name: string
  cnpj: string
  responsible: string
  type: CompanyType
}

export interface UpdateCompanyDto {
  name?: string
  cnpj?: string
  responsible?: string
  type?: CompanyType
}

export interface ICompanyRepository {
  list(params: {
    type?: CompanyType
    limit: number
    offset: number
  }): Promise<{ companies: Company[]; total: number }>
  getById(id: string): Promise<Company>
  create(dto: CreateCompanyDto): Promise<Company>
  update(id: string, dto: UpdateCompanyDto): Promise<Company>
  delete(id: string): Promise<void>
}
