import { FixedCost } from '../../../_shared/domain/entities/fixed-cost.entity.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'
import { CreateFixedCostDto } from '../../validation/schemas.ts'

export async function createFixedCost(dto: CreateFixedCostDto): Promise<FixedCost> {
  return FixedCostRepository.save({
    name: dto.name,
    amount: dto.amount,
    due_day: dto.due_day,
    category: dto.category,
  })
}
