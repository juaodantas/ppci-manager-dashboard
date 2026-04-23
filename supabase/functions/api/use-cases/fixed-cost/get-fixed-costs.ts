import { FixedCost } from '../../../_shared/domain/entities/fixed-cost.entity.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllFixedCosts(params: {
  includeInactive: boolean
  date_from?: string
  date_to?: string
}): Promise<FixedCost[]> {
  return FixedCostRepository.findAll(params)
}

export async function getFixedCostById(id: string): Promise<FixedCost> {
  const fc = await FixedCostRepository.findById(id)
  if (!fc) throw notFound('FixedCost', id)
  return fc
}
