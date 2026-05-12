import { FixedCostInterest } from '../../../_shared/domain/entities/fixed-cost.entity.ts'
import { FixedCostInterestRepository } from '../../repositories/fixed-cost-interest.repository.ts'
import { CreateFixedCostInterestDto } from '../../validation/schemas.ts'
import { assertFixedCostCompetence } from './shared.ts'

export async function createFixedCostInterest(fixedCostId: string, dto: CreateFixedCostInterestDto): Promise<FixedCostInterest> {
  await assertFixedCostCompetence(fixedCostId, dto.reference_year, dto.reference_month)

  return FixedCostInterestRepository.create({
    fixed_cost_id: fixedCostId,
    reference_year: dto.reference_year,
    reference_month: dto.reference_month,
    interest_amount: dto.interest_amount,
  })
}
