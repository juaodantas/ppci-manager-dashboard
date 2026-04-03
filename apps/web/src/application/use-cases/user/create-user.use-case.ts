import type { User } from '../../../domain/entities/user.entity'
import type { IUserRepository } from '../../../domain/repositories/user.repository'

export class CreateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: { name: string; email: string; password: string }): Promise<User> {
    return this.userRepo.create(data)
  }
}
