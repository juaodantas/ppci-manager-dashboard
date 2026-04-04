import { FixedCost } from '../../../_shared/domain/entities/fixed-cost.entity.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'
import { notFound } from '../../errors.ts'
import { UpdateFixedCostDto } from '../../validation/schemas.ts'

export async function updateFixedCost(id: string, dto: UpdateFixedCostDto): Promise<FixedCost> {
  const updated = await FixedCostRepository.update(id, {
    name: dto.name,
    amount: dto.amount,
    due_day: dto.due_day,
    category: dto.category,
  })
  if (!updated) throw notFound('FixedCost', id)
  return updated
}
