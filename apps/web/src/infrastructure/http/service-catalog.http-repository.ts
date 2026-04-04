import type { AxiosInstance } from 'axios'
import type { ServiceCatalogWithCategory, ServiceCategory, ServicePrice } from '@manager/domain'
import type {
  IServiceCatalogRepository,
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
  AddServicePriceDto,
} from '../../domain/repositories/service-catalog.repository'

export class ServiceCatalogHttpRepository implements IServiceCatalogRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(includeInactive = false): Promise<ServiceCatalogWithCategory[]> {
    const { data } = await this.http.get<ServiceCatalogWithCategory[]>('/service-catalog', {
      params: includeInactive ? { include_inactive: true } : undefined,
    })
    return data
  }

  async findCategories(): Promise<ServiceCategory[]> {
    const { data } = await this.http.get<ServiceCategory[]>('/service-catalog/categories')
    return data
  }

  async create(body: CreateServiceCatalogDto): Promise<ServiceCatalogWithCategory> {
    const { data } = await this.http.post<ServiceCatalogWithCategory>('/service-catalog', body)
    return data
  }

  async update(id: string, body: UpdateServiceCatalogDto): Promise<ServiceCatalogWithCategory> {
    const { data } = await this.http.put<ServiceCatalogWithCategory>(`/service-catalog/${id}`, body)
    return data
  }

  async deactivate(id: string): Promise<void> {
    await this.http.delete(`/service-catalog/${id}`)
  }

  async addPrice(serviceId: string, body: AddServicePriceDto): Promise<ServicePrice> {
    const { data } = await this.http.post<ServicePrice>(`/service-catalog/${serviceId}/prices`, body)
    return data
  }
}
