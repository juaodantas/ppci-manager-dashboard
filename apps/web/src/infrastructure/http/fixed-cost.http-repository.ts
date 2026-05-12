import type { AxiosInstance } from 'axios'
import type { FixedCost } from '@manager/domain'
import type {
  IFixedCostRepository,
  FixedCostInterest,
  CreateFixedCostInterestDto,
  UpdateFixedCostInterestDto,
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

  async listInterests(fixedCostId: string, params?: { reference_year?: number }): Promise<FixedCostInterest[]> {
    const { data } = await this.http.get<FixedCostInterest[]>(`/fixed-costs/${fixedCostId}/interests`, {
      params,
    })
    return data
  }

  async createInterest(fixedCostId: string, body: CreateFixedCostInterestDto): Promise<FixedCostInterest> {
    const { data } = await this.http.post<FixedCostInterest>(`/fixed-costs/${fixedCostId}/interests`, body)
    return data
  }

  async updateInterest(fixedCostId: string, interestId: string, body: UpdateFixedCostInterestDto): Promise<FixedCostInterest> {
    const { data } = await this.http.put<FixedCostInterest>(`/fixed-costs/${fixedCostId}/interests/${interestId}`, body)
    return data
  }

  async deleteInterest(fixedCostId: string, interestId: string): Promise<void> {
    await this.http.delete(`/fixed-costs/${fixedCostId}/interests/${interestId}`)
  }
}
