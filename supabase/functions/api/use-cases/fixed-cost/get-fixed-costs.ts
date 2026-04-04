import { FixedCost } from '../../../_shared/domain/entities/fixed-cost.entity.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllFixedCosts(includeInactive = false): Promise<FixedCost[]> {
  return FixedCostRepository.findAll(includeInactive)
}

export async function getFixedCostById(id: string): Promise<FixedCost> {
  const fc = await FixedCostRepository.findById(id)
  if (!fc) throw notFound('FixedCost', id)
  return fc
}
