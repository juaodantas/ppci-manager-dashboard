import { notFound } from '../../errors.ts'
import { FixedCostInterestRepository } from '../../repositories/fixed-cost-interest.repository.ts'

export async function deleteFixedCostInterest(fixedCostId: string, interestId: string): Promise<void> {
  const deleted = await FixedCostInterestRepository.delete(fixedCostId, interestId)
  if (!deleted) {
    throw notFound('FixedCostInterest', interestId)
  }
}
