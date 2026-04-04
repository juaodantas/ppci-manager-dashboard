import { Payment } from '../../../_shared/domain/entities/payment.entity.ts'
import { PaymentRepository } from '../../repositories/payment.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllPayments(params: {
  project_id?: string
  status?: string
  limit: number
  offset: number
}): Promise<{ payments: Payment[]; total: number }> {
  return PaymentRepository.findAll(params)
}

export async function getPaymentById(id: string): Promise<Payment> {
  const payment = await PaymentRepository.findById(id)
  if (!payment) throw notFound('Payment', id)
  return payment
}
