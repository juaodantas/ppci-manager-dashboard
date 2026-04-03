import type { AxiosInstance } from 'axios'
import type { IAuthRepository } from '../../domain/repositories/auth.repository'

export class AuthHttpRepository implements IAuthRepository {
  constructor(private readonly http: AxiosInstance) {}

  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    const { data } = await this.http.post<{ access_token: string; refresh_token: string }>('/auth/login', { email, password })
    return data
  }

  async register(name: string, email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    const { data } = await this.http.post<{ access_token: string; refresh_token: string }>('/auth/register', { name, email, password })
    return data
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    const { data } = await this.http.post<{ access_token: string }>('/auth/refresh', { refresh_token: refreshToken })
    return data
  }

  async logout(refreshToken: string): Promise<void> {
    await this.http.post('/auth/logout', { refresh_token: refreshToken })
  }
}
