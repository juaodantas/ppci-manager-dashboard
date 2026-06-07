export type FixedCostMonthStatus = 'open' | 'confirmed' | 'closed'
export type FixedCostMonthlyLineStatus = 'predicted' | 'edited' | 'confirmed' | 'closed'
export type FixedCostMonthlyLineSource = 'dynamic_base' | 'monthly_entry'
export type FixedCostMonthlyLineEditBlockReason = 'before_start_date' | 'after_end_date' | 'inactive' | 'month_closed'
export type FixedCostMonthlyLineBaseRelationStatus = 'active_for_month' | 'inactive_for_month' | 'snapshot_only'

export interface FixedCostMonth {
  id: string | null
  reference_year: number
  reference_month: number
  company_id: string | null
  status: FixedCostMonthStatus
  confirmed_at: string | null
  closed_at: string | null
}

export interface FixedCostMonthlyLine {
  id: string
  fixed_cost_id: string
  monthly_entry_id: string | null
  name: string
  category: string | null
  company_id: string | null
  due_day: number
  due_date: string
  base_amount: number
  recurring_base_amount: number
  monthly_base_amount: number
  interest_amount: number
  monthly_amount: number
  included: boolean
  source: FixedCostMonthlyLineSource
  status: FixedCostMonthlyLineStatus
  is_editable: boolean
  edit_block_reason?: FixedCostMonthlyLineEditBlockReason
  edit_block_message?: string
  base_relation_status: FixedCostMonthlyLineBaseRelationStatus
}

export interface FixedCostMonthResolution {
  month: FixedCostMonth
  items: FixedCostMonthlyLine[]
  summary: {
    total_base_amount: number
    total_interest_amount: number
    total_monthly_amount: number
    predicted_count: number
    edited_count: number
    confirmed_count: number
    closed_count: number
  }
}

export interface UpdateFixedCostMonthlyEntryDto {
  amount: number
  interest_amount?: number
  due_day?: number
  name?: string
  category?: string | null
  included?: boolean
}

export interface IFixedCostMonthRepository {
  get(params: { reference_year: number; reference_month: number; company_id?: string }): Promise<FixedCostMonthResolution>
  close(params: { referenceYear: number; referenceMonth: number; companyId?: string }): Promise<FixedCostMonthResolution>
  updateEntry(params: {
    fixedCostId: string
    referenceYear: number
    referenceMonth: number
    data: UpdateFixedCostMonthlyEntryDto
  }): Promise<FixedCostMonthResolution>
}
