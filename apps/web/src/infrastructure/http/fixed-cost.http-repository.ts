import type { AxiosInstance } from 'axios'
import type { FixedCost } from '@manager/domain'
import type {
  IFixedCostRepository,
  CreateFixedCostDto,
  UpdateFixedCostDto,
} from '../../domain/repositories/fixed-cost.repository'

export class FixedCostHttpRepository implements IFixedCostRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(params?: { includeInactive?: boolean; date_from?: string; date_to?: string }): Promise<FixedCost[]> {
    const includeInactive = params?.includeInactive ?? false
    const date_from = params?.date_from
    const date_to = params?.date_to
    const queryParams = {
      ...(includeInactive ? { include_inactive: true } : {}),
      ...(date_from ? { date_from } : {}),
      ...(date_to ? { date_to } : {}),
    }
    const { data } = await this.http.get<FixedCost[]>('/fixed-costs', {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
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
