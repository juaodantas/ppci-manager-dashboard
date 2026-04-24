import { VariableCost } from '../../../_shared/domain/entities/variable-cost.entity.ts'
import { VariableCostRepository } from '../../repositories/variable-cost.repository.ts'
import { CreateVariableCostDto } from '../../validation/schemas.ts'

export async function createVariableCost(dto: CreateVariableCostDto): Promise<VariableCost> {
  return VariableCostRepository.save({
    name: dto.name,
    amount: dto.amount,
    date: dto.date,
    category: dto.category,
    description: dto.description,
    company_id: dto.company_id,
  })
}
