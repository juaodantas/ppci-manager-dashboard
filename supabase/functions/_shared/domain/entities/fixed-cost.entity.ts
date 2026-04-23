export interface FixedCost {
  id: string
  name: string
  amount: number
  due_day: number
  category?: string | null
  active: boolean
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}
