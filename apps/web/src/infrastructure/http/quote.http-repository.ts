import type { AxiosInstance } from 'axios'
import type { Quote } from '@manager/domain'
import type {
  IQuoteRepository,
  CreateQuoteDto,
  UpdateQuoteDto,
  ApproveQuoteDto,
} from '../../domain/repositories/quote.repository'

export class QuoteHttpRepository implements IQuoteRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(params: {
    limit: number
    offset: number
    status?: string
    customer_id?: string
  }): Promise<{ quotes: Quote[]; total: number }> {
    const { data } = await this.http.get<{ quotes: Quote[]; total: number }>('/quotes', { params })
    return data
  }

  async findById(id: string): Promise<Quote> {
    const { data } = await this.http.get<Quote>(`/quotes/${id}`)
    return data
  }

  async create(body: CreateQuoteDto): Promise<Quote> {
    const { data } = await this.http.post<Quote>('/quotes', body)
    return data
  }

  async update(id: string, body: UpdateQuoteDto): Promise<Quote> {
    const { data } = await this.http.put<Quote>(`/quotes/${id}`, body)
    return data
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/quotes/${id}`)
  }

  async approve(id: string, body: ApproveQuoteDto): Promise<{ project_id: string }> {
    const { data } = await this.http.post<{ project_id: string }>(`/quotes/${id}/approve`, body)
    return data
  }
}
