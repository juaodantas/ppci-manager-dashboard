import { VariableCost } from '../../../_shared/domain/entities/variable-cost.entity.ts'
import { VariableCostRepository } from '../../repositories/variable-cost.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllVariableCosts(params: { date_from?: string; date_to?: string; company_id?: string }): Promise<VariableCost[]> {
  return VariableCostRepository.findAll(params)
}

export async function getVariableCostById(id: string): Promise<VariableCost> {
  const vc = await VariableCostRepository.findById(id)
  if (!vc) throw notFound('VariableCost', id)
  return vc
}
