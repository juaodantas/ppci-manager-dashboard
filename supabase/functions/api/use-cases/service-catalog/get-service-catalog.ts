import {
  ServiceCatalogItem,
  ServiceCatalogWithCategory,
  ServiceCategory,
} from '../../../_shared/domain/entities/service-catalog.entity.ts'
import { ServiceCatalogRepository } from '../../repositories/service-catalog.repository.ts'
import { notFound } from '../../errors.ts'

export async function getServiceCatalog(
  includeInactive = false,
): Promise<ServiceCatalogWithCategory[]> {
  return ServiceCatalogRepository.findAllWithCategory(includeInactive)
}

export async function getServiceCatalogById(id: string): Promise<ServiceCatalogItem> {
  const item = await ServiceCatalogRepository.findById(id)
  if (!item) throw notFound('ServiceCatalogItem', id)
  return item
}

export async function getCategories(): Promise<ServiceCategory[]> {
  return ServiceCatalogRepository.findCategories()
}
