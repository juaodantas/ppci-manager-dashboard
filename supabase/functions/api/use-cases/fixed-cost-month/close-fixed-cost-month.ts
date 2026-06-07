import { FixedCostMonthRepository } from '../../repositories/fixed-cost-month.repository.ts'
import { FixedCostMonthResolutionRepository } from '../../repositories/fixed-cost-month-resolution.repository.ts'
import type { FixedCostMonthResolution } from '../../../_shared/domain/index.ts'

export async function closeFixedCostMonth(params: {
  referenceYear: number
  referenceMonth: number
  companyId?: string
}): Promise<FixedCostMonthResolution> {
  const resolution = await FixedCostMonthResolutionRepository.resolve(params)
  await FixedCostMonthRepository.materializeMonth({
    referenceYear: params.referenceYear,
    referenceMonth: params.referenceMonth,
    companyId: params.companyId,
    status: 'closed',
    lines: resolution.items,
  })
  return FixedCostMonthResolutionRepository.resolve(params)
}
