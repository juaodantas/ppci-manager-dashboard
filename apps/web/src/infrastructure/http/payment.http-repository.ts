import type { AxiosInstance } from 'axios'
import type { Payment } from '@manager/domain'
import type {
  IPaymentRepository,
  CreatePaymentDto,
} from '../../domain/repositories/payment.repository'

export class PaymentHttpRepository implements IPaymentRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(params: {
    project_id?: string
    status?: string
    limit: number
    offset: number
  }): Promise<{ payments: Payment[]; total: number }> {
    const { data } = await this.http.get<{ payments: Payment[]; total: number }>('/payments', { params })
    return data
  }

  async findById(id: string): Promise<Payment> {
    const { data } = await this.http.get<Payment>(`/payments/${id}`)
    return data
  }

  async create(body: CreatePaymentDto): Promise<Payment> {
    const { data } = await this.http.post<Payment>('/payments', body)
    return data
  }

  async pay(id: string, paid_date: string): Promise<Payment> {
    const { data } = await this.http.put<Payment>(`/payments/${id}/pay`, { paid_date })
    return data
  }
}
