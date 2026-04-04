import { ServiceCatalogItem } from '../../../_shared/domain/entities/service-catalog.entity.ts'
import { ServiceCatalogRepository } from '../../repositories/service-catalog.repository.ts'
import { CreateServiceCatalogDto } from '../../validation/schemas.ts'

export async function createService(dto: CreateServiceCatalogDto): Promise<ServiceCatalogItem> {
  return ServiceCatalogRepository.save({
    category_id: dto.category_id,
    name: dto.name,
    description: dto.description,
    unit_type: dto.unit_type,
  })
}
