import { VariableCost } from '../../../_shared/domain/entities/variable-cost.entity.ts'
import { VariableCostRepository } from '../../repositories/variable-cost.repository.ts'
import { notFound } from '../../errors.ts'
import { UpdateVariableCostDto } from '../../validation/schemas.ts'

export async function updateVariableCost(id: string, dto: UpdateVariableCostDto): Promise<VariableCost> {
  const updated = await VariableCostRepository.update(id, {
    name: dto.name,
    amount: dto.amount,
    date: dto.date,
    category: dto.category,
    description: dto.description,
    company_id: dto.company_id,
  })
  if (!updated) throw notFound('VariableCost', id)
  return updated
}
