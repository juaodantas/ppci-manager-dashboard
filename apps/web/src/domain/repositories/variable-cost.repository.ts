import type { VariableCost } from '@manager/domain'

export interface CreateVariableCostDto {
  name: string
  amount: number
  date: string
  category?: string
  description?: string
}

export interface UpdateVariableCostDto {
  name?: string
  amount?: number
  date?: string
  category?: string
  description?: string
}

export interface IVariableCostRepository {
  findAll(params?: { date_from?: string; date_to?: string }): Promise<VariableCost[]>
  create(data: CreateVariableCostDto): Promise<VariableCost>
  update(id: string, data: UpdateVariableCostDto): Promise<VariableCost>
  delete(id: string): Promise<void>
}
