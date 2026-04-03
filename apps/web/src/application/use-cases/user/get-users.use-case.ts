import type { User } from '../../../domain/entities/user.entity'
import type { IUserRepository } from '../../../domain/repositories/user.repository'

export class GetUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async getAll(): Promise<User[]> {
    return this.userRepo.findAll()
  }

  async getById(id: string): Promise<User> {
    return this.userRepo.findById(id)
  }
}
