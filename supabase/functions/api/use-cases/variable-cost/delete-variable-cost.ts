import { VariableCostRepository } from '../../repositories/variable-cost.repository.ts'
import { notFound } from '../../errors.ts'

export async function deleteVariableCost(id: string): Promise<void> {
  const existing = await VariableCostRepository.findById(id)
  if (!existing) throw notFound('VariableCost', id)
  await VariableCostRepository.delete(id)
}
