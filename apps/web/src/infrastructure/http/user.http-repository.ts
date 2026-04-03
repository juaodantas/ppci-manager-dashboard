import type { AxiosInstance } from 'axios'
import type { User } from '../../domain/entities/user.entity'
import type { IUserRepository } from '../../domain/repositories/user.repository'

export class UserHttpRepository implements IUserRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(): Promise<User[]> {
    const { data } = await this.http.get<{ data: User[]; total: number; limit: number; offset: number }>('/users')
    return data.data
  }

  async findById(id: string): Promise<User> {
    const { data } = await this.http.get<User>(`/users/${id}`)
    return data
  }

  async create(body: { name: string; email: string; password: string }): Promise<User> {
    const { data } = await this.http.post<User>('/users', body)
    return data
  }

  async update(id: string, body: { name?: string; password?: string }): Promise<User> {
    const { data } = await this.http.patch<User>(`/users/${id}`, body)
    return data
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/users/${id}`)
  }
}
