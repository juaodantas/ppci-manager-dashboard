import type { FixedCost } from '@manager/domain'

export interface CreateFixedCostDto {
  name: string
  amount: number
  due_day: number
  category?: string
}

export interface UpdateFixedCostDto {
  name?: string
  amount?: number
  due_day?: number
  category?: string
}

export interface IFixedCostRepository {
  findAll(includeInactive?: boolean): Promise<FixedCost[]>
  create(data: CreateFixedCostDto): Promise<FixedCost>
  update(id: string, data: UpdateFixedCostDto): Promise<FixedCost>
  delete(id: string): Promise<void>
}
