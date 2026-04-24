import { FixedCost } from '../../../_shared/domain/entities/fixed-cost.entity.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'
import { badRequest, notFound } from '../../errors.ts'
import { UpdateFixedCostDto } from '../../validation/schemas.ts'

export async function updateFixedCost(id: string, dto: UpdateFixedCostDto): Promise<FixedCost> {
  if (dto.start_date !== undefined || dto.end_date !== undefined) {
    const current = await FixedCostRepository.findById(id)
    if (!current) throw notFound('FixedCost', id)
    const startDate = dto.start_date ?? current.start_date
    const endDate = dto.end_date ?? current.end_date
    if (endDate !== null && endDate < startDate) {
      throw badRequest('end_date must be greater than or equal to start_date')
    }
  }
  const updated = await FixedCostRepository.update(id, {
    name: dto.name,
    amount: dto.amount,
    due_day: dto.due_day,
    category: dto.category,
    company_id: dto.company_id,
    start_date: dto.start_date,
    end_date: dto.end_date,
  })
  if (!updated) throw notFound('FixedCost', id)
  return updated
}
