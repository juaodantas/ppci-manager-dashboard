import type { User } from '../entities/user.entity'

export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: string): Promise<User>
  create(data: { name: string; email: string; password: string }): Promise<User>
  update(id: string, data: { name?: string; password?: string }): Promise<User>
  delete(id: string): Promise<void>
}
