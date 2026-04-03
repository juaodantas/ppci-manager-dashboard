import { Service } from '../../../_shared/domain/entities/service.entity.ts'
import { ServiceRepository } from '../../repositories/service.repository.ts'
import { notFound } from '../../errors.ts'
import { CreateServiceDto } from './create-service.ts'

export type UpdateServiceDto = Partial<CreateServiceDto>

export async function updateService(id: string, dto: UpdateServiceDto): Promise<Service> {
  const service = await ServiceRepository.findById(id)
  if (!service) throw notFound('Service', id)

  if (dto.cliente !== undefined) service.cliente = dto.cliente
  if (dto.tipo !== undefined) service.tipo = dto.tipo
  if (dto.status !== undefined) service.status = dto.status
  if (dto.data_inicio !== undefined) service.data_inicio = dto.data_inicio
  if (dto.data_fim !== undefined) service.data_fim = dto.data_fim
  if (dto.valor_total !== undefined) service.valor_total = dto.valor_total
  if (dto.forma_pagamento !== undefined) service.forma_pagamento = dto.forma_pagamento
  if (dto.cronograma !== undefined) service.cronograma = dto.cronograma
  if (dto.pagamentos !== undefined) service.pagamentos = dto.pagamentos
  if (dto.documentos !== undefined) service.documentos = dto.documentos
  if (dto.custos_fixos !== undefined) service.custos_fixos = dto.custos_fixos
  if (dto.parcelamento !== undefined) service.parcelamento = dto.parcelamento

  service.updatedAt = new Date()

  return ServiceRepository.save(service)
}
