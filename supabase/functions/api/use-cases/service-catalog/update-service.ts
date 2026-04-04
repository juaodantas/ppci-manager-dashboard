import { ServiceCatalogItem } from '../../../_shared/domain/entities/service-catalog.entity.ts'
import { ServiceCatalogRepository } from '../../repositories/service-catalog.repository.ts'
import { notFound } from '../../errors.ts'
import { UpdateServiceCatalogDto } from '../../validation/schemas.ts'

export async function updateService(
  id: string,
  dto: UpdateServiceCatalogDto,
): Promise<ServiceCatalogItem> {
  const updated = await ServiceCatalogRepository.update(id, {
    name: dto.name,
    description: dto.description,
    unit_type: dto.unit_type,
  })
  if (!updated) throw notFound('ServiceCatalogItem', id)
  return updated
}
