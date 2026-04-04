import { ServicePrice } from '../../../_shared/domain/entities/service-catalog.entity.ts'
import { ServiceCatalogRepository } from '../../repositories/service-catalog.repository.ts'
import { notFound } from '../../errors.ts'
import { AddServicePriceDto } from '../../validation/schemas.ts'

export async function addServicePrice(
  serviceId: string,
  dto: AddServicePriceDto,
): Promise<ServicePrice> {
  const item = await ServiceCatalogRepository.findById(serviceId)
  if (!item) throw notFound('ServiceCatalogItem', serviceId)

  return ServiceCatalogRepository.addPrice(serviceId, {
    price_per_unit: dto.price_per_unit,
    minimum_price: dto.minimum_price,
    valid_from: dto.valid_from,
  })
}
