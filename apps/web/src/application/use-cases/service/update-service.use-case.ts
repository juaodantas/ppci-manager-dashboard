import type { Service } from '../../../domain/entities/service.entity'
import type { IServiceRepository } from '../../../domain/repositories/service.repository'
import type { UpdateServiceDto } from './service.types'

export class UpdateServiceUseCase {
  constructor(private readonly serviceRepo: IServiceRepository) {}

  async execute(id: string, data: UpdateServiceDto): Promise<Service> {
    return this.serviceRepo.update(id, data)
  }
}
