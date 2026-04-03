import type { IUserRepository } from '../../../domain/repositories/user.repository'

export class DeleteUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<void> {
    return this.userRepo.delete(id)
  }
}
