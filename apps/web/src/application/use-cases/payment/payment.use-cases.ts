import type { Payment } from '@manager/domain'
import type {
  IPaymentRepository,
  CreatePaymentDto,
} from '../../../domain/repositories/payment.repository'

export class GetPaymentsUseCase {
  constructor(private readonly repo: IPaymentRepository) {}
  execute(params: {
    project_id?: string
    status?: string
    limit: number
    offset: number
  }): Promise<{ payments: Payment[]; total: number }> {
    return this.repo.findAll(params)
  }
}

export class CreatePaymentUseCase {
  constructor(private readonly repo: IPaymentRepository) {}
  execute(data: CreatePaymentDto): Promise<Payment> {
    return this.repo.create(data)
  }
}

export class PayPaymentUseCase {
  constructor(private readonly repo: IPaymentRepository) {}
  execute(id: string, paid_date: string): Promise<Payment> {
    return this.repo.pay(id, paid_date)
  }
}
