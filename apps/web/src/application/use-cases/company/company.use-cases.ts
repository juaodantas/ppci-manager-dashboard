import type { Company, CompanyType } from '@manager/domain'
import type {
  ICompanyRepository,
  CreateCompanyDto,
  UpdateCompanyDto,
} from '../../../domain/repositories/company.repository'

export class GetCompaniesUseCase {
  constructor(private readonly repo: ICompanyRepository) {}
  execute(params: { type?: CompanyType; limit: number; offset: number }): Promise<{ companies: Company[]; total: number }> {
    return this.repo.list(params)
  }
}

export class GetCompanyUseCase {
  constructor(private readonly repo: ICompanyRepository) {}
  execute(id: string): Promise<Company> {
    return this.repo.getById(id)
  }
}

export class CreateCompanyUseCase {
  constructor(private readonly repo: ICompanyRepository) {}
  execute(dto: CreateCompanyDto): Promise<Company> {
    return this.repo.create(dto)
  }
}

export class UpdateCompanyUseCase {
  constructor(private readonly repo: ICompanyRepository) {}
  execute(id: string, dto: UpdateCompanyDto): Promise<Company> {
    return this.repo.update(id, dto)
  }
}

export class DeleteCompanyUseCase {
  constructor(private readonly repo: ICompanyRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}
