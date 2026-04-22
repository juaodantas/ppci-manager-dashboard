import { ServiceCatalogItem } from '../../../_shared/domain/entities/service-catalog.entity.ts'
import { badRequest } from '../../errors.ts'
import { ServiceCatalogRepository } from '../../repositories/service-catalog.repository.ts'
import { CreateServiceCatalogDto } from '../../validation/schemas.ts'

export async function createService(dto: CreateServiceCatalogDto): Promise<ServiceCatalogItem> {
  const categories = await ServiceCatalogRepository.findCategories()
  const exists = categories.some((category) => category.id === dto.category_id)
  if (!exists) throw badRequest('Category not found')

  return ServiceCatalogRepository.save({
    category_id: dto.category_id,
    name: dto.name,
    description: dto.description,
    unit_type: dto.unit_type,
  })
}
