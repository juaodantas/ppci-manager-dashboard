import { FixedCostInterest } from '../../../_shared/domain/entities/fixed-cost.entity.ts'
import { notFound } from '../../errors.ts'
import { FixedCostInterestRepository } from '../../repositories/fixed-cost-interest.repository.ts'
import { UpdateFixedCostInterestDto } from '../../validation/schemas.ts'
import { assertFixedCostCompetence } from './shared.ts'

export async function updateFixedCostInterest(
  fixedCostId: string,
  interestId: string,
  dto: UpdateFixedCostInterestDto,
): Promise<FixedCostInterest> {
  await assertFixedCostCompetence(fixedCostId, dto.reference_year, dto.reference_month)

  const updated = await FixedCostInterestRepository.update(fixedCostId, interestId, {
    reference_year: dto.reference_year,
    reference_month: dto.reference_month,
    interest_amount: dto.interest_amount,
  })

  if (!updated) {
    throw notFound('FixedCostInterest', interestId)
  }

  return updated
}
