import { Service, ServiceStats } from '../../../_shared/domain/entities/service.entity.ts'
import { ServiceRepository } from '../../repositories/service.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllServices(params: {
  status?: string
  clienteId?: string
  limit: number
  offset: number
}): Promise<{ servicos: object[]; total: number; limit: number; offset: number }> {
  const { services, total } = await ServiceRepository.findAllPaginated(
    params.limit,
    params.offset,
    params.status,
    params.clienteId,
  )
  return {
    servicos: services,
    total,
    limit: params.limit,
    offset: params.offset,
  }
}

export async function getServiceById(id: string): Promise<Service> {
  const service = await ServiceRepository.findById(id)
  if (!service) throw notFound('Service', id)
  return service
}

export async function getServiceStats(): Promise<ServiceStats> {
  return ServiceRepository.getStats()
}
