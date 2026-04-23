import type { FixedCost } from '@manager/domain'

export interface CreateFixedCostDto {
  name: string
  amount: number
  due_day: number
  category?: string
  start_date?: string
  end_date?: string | null
}

export interface UpdateFixedCostDto {
  name?: string
  amount?: number
  due_day?: number
  category?: string
  start_date?: string
  end_date?: string | null
}

export interface IFixedCostRepository {
  findAll(params?: { includeInactive?: boolean; date_from?: string; date_to?: string }): Promise<FixedCost[]>
  create(data: CreateFixedCostDto): Promise<FixedCost>
  update(id: string, data: UpdateFixedCostDto): Promise<FixedCost>
  delete(id: string): Promise<void>
}
