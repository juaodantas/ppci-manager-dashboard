import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'
import { notFound } from '../../errors.ts'

export async function deleteFixedCost(id: string): Promise<void> {
  const existing = await FixedCostRepository.findById(id)
  if (!existing) throw notFound('FixedCost', id)
  await FixedCostRepository.delete(id)
}
