import type { Service, ServiceStats } from '../../../domain/entities/service.entity'
import type { IServiceRepository } from '../../../domain/repositories/service.repository'

export class GetServicesUseCase {
  constructor(private readonly serviceRepo: IServiceRepository) {}

  async getAll(params?: {
    status?: string
    clienteId?: string
    limit?: number
    offset?: number
  }): Promise<{ servicos: Service[]; total: number; limit: number; offset: number }> {
    return this.serviceRepo.findAll(params)
  }

  async getById(id: string): Promise<Service> {
    return this.serviceRepo.findById(id)
  }

  async getStats(): Promise<ServiceStats> {
    return this.serviceRepo.getStats()
  }
}
