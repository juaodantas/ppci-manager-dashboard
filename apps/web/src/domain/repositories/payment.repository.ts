import type { Payment } from '@manager/domain'

export interface CreatePaymentDto {
  project_id: string
  amount: number
  due_date: string
  payment_method?: string
  notes?: string
}

export interface IPaymentRepository {
  findAll(params: {
    project_id?: string
    status?: string
    limit: number
    offset: number
  }): Promise<{ payments: Payment[]; total: number }>
  findById(id: string): Promise<Payment>
  create(data: CreatePaymentDto): Promise<Payment>
  pay(id: string, paid_date: string): Promise<Payment>
}
