import type { Quote } from '@manager/domain'

export interface QuoteItemDto {
  service_id: string
  quantity: number
  unit_price: number
  description?: string
}

export interface CreateQuoteDto {
  customer_id: string
  valid_until?: string
  discount?: number
  notes?: string
  items: QuoteItemDto[]
}

export interface UpdateQuoteDto {
  valid_until?: string
  discount?: number
  notes?: string
  status?: 'draft' | 'sent' | 'rejected'
  items?: QuoteItemDto[]
}

export interface ApproveQuoteDto {
  name: string
  start_date?: string
}

export interface IQuoteRepository {
  findAll(params: {
    limit: number
    offset: number
    status?: string
    customer_id?: string
  }): Promise<{ quotes: Quote[]; total: number }>
  findById(id: string): Promise<Quote>
  create(data: CreateQuoteDto): Promise<Quote>
  update(id: string, data: UpdateQuoteDto): Promise<Quote>
  delete(id: string): Promise<void>
  approve(id: string, data: ApproveQuoteDto): Promise<{ project_id: string }>
}
