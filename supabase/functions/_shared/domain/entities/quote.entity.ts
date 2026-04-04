export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected'

export interface QuoteItem {
  id: string
  quote_id: string
  service_id: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Quote {
  id: string
  customer_id: string
  status: QuoteStatus
  total_amount: number
  discount: number
  valid_until?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  items?: QuoteItem[]
}
