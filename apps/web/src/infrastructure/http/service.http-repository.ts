import type { AxiosInstance } from 'axios'
import type { Service, ServiceStats } from '../../domain/entities/service.entity'
import type { IServiceRepository } from '../../domain/repositories/service.repository'
import type { CreateServiceDto, UpdateServiceDto } from '../../application/use-cases/service/service.types'

export class ServiceHttpRepository implements IServiceRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(params?: {
    status?: string
    clienteId?: string
    limit?: number
    offset?: number
  }): Promise<{ servicos: Service[]; total: number; limit: number; offset: number }> {
    const { data } = await this.http.get<{
      servicos: Service[]
      total: number
      limit: number
      offset: number
    }>('/services', { params })
    return data
  }

  async findById(id: string): Promise<Service> {
    const { data } = await this.http.get<Service>(`/services/${id}`)
    return data
  }

  async getStats(): Promise<ServiceStats> {
    const { data } = await this.http.get<ServiceStats>('/services/stats')
    return data
  }

  async create(body: CreateServiceDto): Promise<Service> {
    const { data } = await this.http.post<Service>('/services', body)
    return data
  }

  async update(id: string, body: UpdateServiceDto): Promise<Service> {
    const { data } = await this.http.patch<Service>(`/services/${id}`, body)
    return data
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/services/${id}`)
  }
}
