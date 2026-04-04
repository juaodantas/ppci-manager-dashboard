import type { ServiceCatalogWithCategory, ServiceCategory, ServicePrice } from '@manager/domain'
import type {
  IServiceCatalogRepository,
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
  AddServicePriceDto,
} from '../../../domain/repositories/service-catalog.repository'

export class GetServiceCatalogUseCase {
  constructor(private readonly repo: IServiceCatalogRepository) {}
  execute(includeInactive = false): Promise<ServiceCatalogWithCategory[]> {
    return this.repo.findAll(includeInactive)
  }
  categories(): Promise<ServiceCategory[]> {
    return this.repo.findCategories()
  }
}

export class CreateServiceCatalogUseCase {
  constructor(private readonly repo: IServiceCatalogRepository) {}
  execute(data: CreateServiceCatalogDto): Promise<ServiceCatalogWithCategory> {
    return this.repo.create(data)
  }
}

export class UpdateServiceCatalogUseCase {
  constructor(private readonly repo: IServiceCatalogRepository) {}
  execute(id: string, data: UpdateServiceCatalogDto): Promise<ServiceCatalogWithCategory> {
    return this.repo.update(id, data)
  }
}

export class DeactivateServiceUseCase {
  constructor(private readonly repo: IServiceCatalogRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.deactivate(id)
  }
}

export class AddServicePriceUseCase {
  constructor(private readonly repo: IServiceCatalogRepository) {}
  execute(serviceId: string, data: AddServicePriceDto): Promise<ServicePrice> {
    return this.repo.addPrice(serviceId, data)
  }
}
