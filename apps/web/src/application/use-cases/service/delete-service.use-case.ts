import type { IServiceRepository } from '../../../domain/repositories/service.repository'

export class DeleteServiceUseCase {
  constructor(private readonly serviceRepo: IServiceRepository) {}

  async execute(id: string): Promise<void> {
    return this.serviceRepo.delete(id)
  }
}
