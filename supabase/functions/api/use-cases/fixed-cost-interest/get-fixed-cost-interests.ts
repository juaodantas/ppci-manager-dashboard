import { FixedCostInterest } from '../../../_shared/domain/entities/fixed-cost.entity.ts'
import { notFound } from '../../errors.ts'
import { FixedCostInterestRepository } from '../../repositories/fixed-cost-interest.repository.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'

export async function getFixedCostInterests(fixedCostId: string, referenceYear?: number): Promise<FixedCostInterest[]> {
  const fixedCost = await FixedCostRepository.findById(fixedCostId)
  if (!fixedCost) {
    throw notFound('FixedCost', fixedCostId)
  }

  return FixedCostInterestRepository.findAllByFixedCost(fixedCostId, referenceYear)
}
