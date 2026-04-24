import type { AxiosInstance } from 'axios'
import type { Company, CompanyType } from '@manager/domain'
import type {
  ICompanyRepository,
  CreateCompanyDto,
  UpdateCompanyDto,
} from '../../domain/repositories/company.repository'

export class CompanyHttpRepository implements ICompanyRepository {
  constructor(private readonly http: AxiosInstance) {}

  async list(params: { type?: CompanyType; limit: number; offset: number }): Promise<{ companies: Company[]; total: number }> {
    const { data } = await this.http.get<{
      data: Company[]
      total: number
      limit: number
      offset: number
    }>('/companies', { params })
    return { companies: data.data, total: data.total }
  }

  async getById(id: string): Promise<Company> {
    const { data } = await this.http.get<Company>(`/companies/${id}`)
    return data
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const { data } = await this.http.post<Company>('/companies', dto)
    return data
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const { data } = await this.http.put<Company>(`/companies/${id}`, dto)
    return data
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/companies/${id}`)
  }
}
