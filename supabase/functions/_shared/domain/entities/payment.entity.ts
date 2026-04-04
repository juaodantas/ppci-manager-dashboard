export type PaymentStatus = 'pending' | 'paid' | 'overdue'

export interface Payment {
  id: string
  project_id: string
  amount: number
  due_date: string
  paid_date?: string | null
  status: PaymentStatus
  payment_method?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}
