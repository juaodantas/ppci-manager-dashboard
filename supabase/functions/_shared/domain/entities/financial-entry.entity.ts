export type EntryType = 'income' | 'expense'
export type EntrySourceType = 'payment' | 'fixed_cost' | 'variable_cost'

export interface FinancialEntry {
  id: string
  type: EntryType
  source_type: EntrySourceType
  source_id: string
  amount: number
  date: string
  description?: string | null
  created_at: string
}

export interface FinancialReport {
  total_income: number
  total_expense: number
  balance: number
  entries_by_month: {
    month: string
    income: number
    expense: number
    balance: number
  }[]
}
