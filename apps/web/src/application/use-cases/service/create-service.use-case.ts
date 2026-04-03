import type { Service } from '../../../domain/entities/service.entity'
import type { IServiceRepository } from '../../../domain/repositories/service.repository'
import type { CreateServiceDto } from './service.types'

export class CreateServiceUseCase {
  constructor(private readonly serviceRepo: IServiceRepository) {}

  async execute(data: CreateServiceDto): Promise<Service> {
    return this.serviceRepo.create(data)
  }
}
