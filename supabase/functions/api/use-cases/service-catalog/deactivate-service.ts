import { ServiceCatalogRepository } from '../../repositories/service-catalog.repository.ts'
import { notFound } from '../../errors.ts'

export async function deactivateService(id: string): Promise<void> {
  const item = await ServiceCatalogRepository.findById(id)
  if (!item) throw notFound('ServiceCatalogItem', id)
  await ServiceCatalogRepository.deactivate(id)
}
