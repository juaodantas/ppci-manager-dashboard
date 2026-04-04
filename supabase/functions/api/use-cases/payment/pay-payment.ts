import { Payment } from '../../../_shared/domain/entities/payment.entity.ts'
import { PaymentRepository } from '../../repositories/payment.repository.ts'
import { notFound, badRequest } from '../../errors.ts'
import { PayPaymentDto } from '../../validation/schemas.ts'

export async function payPayment(id: string, dto: PayPaymentDto): Promise<Payment> {
  const existing = await PaymentRepository.findById(id)
  if (!existing) throw notFound('Payment', id)

  if (existing.status === 'paid') {
    throw badRequest('Payment is already paid')
  }

  const updated = await PaymentRepository.pay(id, dto.paid_date)
  return updated!
}
