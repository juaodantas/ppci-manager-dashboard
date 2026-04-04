import { Payment } from '../../../_shared/domain/entities/payment.entity.ts'
import { PaymentRepository } from '../../repositories/payment.repository.ts'
import { CreatePaymentDto } from '../../validation/schemas.ts'

export async function createPayment(dto: CreatePaymentDto): Promise<Payment> {
  return PaymentRepository.save({
    project_id: dto.project_id,
    amount: dto.amount,
    due_date: dto.due_date,
    payment_method: dto.payment_method,
    notes: dto.notes,
  })
}
