import type { ServiceCatalogWithCategory, ServiceCategory, ServicePrice } from '@manager/domain'

export interface CreateServiceCatalogDto {
  category_id: string
  name: string
  description?: string
  unit_type?: string
}

export interface UpdateServiceCatalogDto {
  name?: string
  description?: string
  unit_type?: string
}

export interface AddServicePriceDto {
  price_per_unit: number
  minimum_price?: number
  valid_from?: string
}

export interface IServiceCatalogRepository {
  findAll(includeInactive?: boolean): Promise<ServiceCatalogWithCategory[]>
  findCategories(): Promise<ServiceCategory[]>
  create(data: CreateServiceCatalogDto): Promise<ServiceCatalogWithCategory>
  update(id: string, data: UpdateServiceCatalogDto): Promise<ServiceCatalogWithCategory>
  deactivate(id: string): Promise<void>
  addPrice(serviceId: string, data: AddServicePriceDto): Promise<ServicePrice>
}
