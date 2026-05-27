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

export interface FinancialHistoricalMonth {
  month: string
  income: number
  expense: number
  balance: number
  mom_income_pct: number | null
  mom_expense_pct: number | null
  mom_balance_pct: number | null
}

export interface FinancialExpenseCompositionMonth {
  month: string
  fixed_expense: number
  variable_expense: number
  fixed_share_pct: number
  variable_share_pct: number
}

export interface FinancialForecastMonth {
  month: string
  forecast_income: number
  forecast_expense: number
  forecast_balance: number
  is_negative_balance: boolean
}

export interface FinancialAnalytics {
  historical_by_month: FinancialHistoricalMonth[]
  expense_composition_by_month: FinancialExpenseCompositionMonth[]
  forecast_by_month: FinancialForecastMonth[]
}
