import type { AxiosInstance } from 'axios'
import type { FixedCost } from '@manager/domain'
import type {
  IFixedCostRepository,
  CreateFixedCostDto,
  UpdateFixedCostDto,
} from '../../domain/repositories/fixed-cost.repository'

export class FixedCostHttpRepository implements IFixedCostRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(includeInactive = false): Promise<FixedCost[]> {
    const { data } = await this.http.get<FixedCost[]>('/fixed-costs', {
      params: includeInactive ? { include_inactive: true } : undefined,
    })
    return data
  }

  async create(body: CreateFixedCostDto): Promise<FixedCost> {
    const { data } = await this.http.post<FixedCost>('/fixed-costs', body)
    return data
  }

  async update(id: string, body: UpdateFixedCostDto): Promise<FixedCost> {
    const { data } = await this.http.put<FixedCost>(`/fixed-costs/${id}`, body)
    return data
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/fixed-costs/${id}`)
  }
}
