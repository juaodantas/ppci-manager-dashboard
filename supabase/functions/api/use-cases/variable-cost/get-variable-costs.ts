import { VariableCost } from '../../../_shared/domain/entities/variable-cost.entity.ts'
import { VariableCostRepository } from '../../repositories/variable-cost.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllVariableCosts(date_from?: string, date_to?: string): Promise<VariableCost[]> {
  return VariableCostRepository.findAll(date_from, date_to)
}

export async function getVariableCostById(id: string): Promise<VariableCost> {
  const vc = await VariableCostRepository.findById(id)
  if (!vc) throw notFound('VariableCost', id)
  return vc
}
