import type { User } from '../../../domain/entities/user.entity'
import type { IUserRepository } from '../../../domain/repositories/user.repository'

export class UpdateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string, data: { name?: string; password?: string }): Promise<User> {
    return this.userRepo.update(id, data)
  }
}
