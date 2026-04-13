import type { AxiosInstance } from 'axios'
import type { VariableCost } from '@manager/domain'
import type {
  IVariableCostRepository,
  CreateVariableCostDto,
  UpdateVariableCostDto,
} from '../../domain/repositories/variable-cost.repository'

export class VariableCostHttpRepository implements IVariableCostRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(params?: { date_from?: string; date_to?: string }): Promise<VariableCost[]> {
    const { data } = await this.http.get<VariableCost[]>('/variable-costs', {
      params,
    })
    return data
  }

  async create(body: CreateVariableCostDto): Promise<VariableCost> {
    const { data } = await this.http.post<VariableCost>('/variable-costs', body)
    return data
  }

  async update(id: string, body: UpdateVariableCostDto): Promise<VariableCost> {
    const { data } = await this.http.put<VariableCost>(`/variable-costs/${id}`, body)
    return data
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/variable-costs/${id}`)
  }
}
