import type { FixedCost } from '@manager/domain'

export interface FixedCostInterest {
  id: string
  fixed_cost_id: string
  reference_year: number
  reference_month: number
  interest_amount: number
  created_at: string
  updated_at: string
}

export interface CreateFixedCostInterestDto {
  reference_year: number
  reference_month: number
  interest_amount: number
}

export interface UpdateFixedCostInterestDto {
  reference_year: number
  reference_month: number
  interest_amount: number
}

export interface CreateFixedCostDto {
  name: string
  amount: number
  due_day: number
  category?: string
  start_date?: string
  end_date?: string | null
  company_id?: string
}

export interface UpdateFixedCostDto {
  name?: string
  amount?: number
  due_day?: number
  category?: string
  start_date?: string
  end_date?: string | null
  company_id?: string | null
}

export interface IFixedCostRepository {
  findAll(params?: { includeInactive?: boolean; date_from?: string; date_to?: string; company_id?: string }): Promise<FixedCost[]>
  create(data: CreateFixedCostDto): Promise<FixedCost>
  update(id: string, data: UpdateFixedCostDto): Promise<FixedCost>
  delete(id: string): Promise<void>
  listInterests(fixedCostId: string, params?: { reference_year?: number }): Promise<FixedCostInterest[]>
  createInterest(fixedCostId: string, data: CreateFixedCostInterestDto): Promise<FixedCostInterest>
  updateInterest(fixedCostId: string, interestId: string, data: UpdateFixedCostInterestDto): Promise<FixedCostInterest>
  deleteInterest(fixedCostId: string, interestId: string): Promise<void>
}
