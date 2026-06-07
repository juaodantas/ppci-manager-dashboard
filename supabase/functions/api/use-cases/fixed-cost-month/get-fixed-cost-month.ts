import { FixedCostMonthResolutionRepository } from '../../repositories/fixed-cost-month-resolution.repository.ts'
import type { FixedCostMonthResolution } from '../../../_shared/domain/index.ts'

export function getFixedCostMonth(params: {
  reference_year: number
  reference_month: number
  company_id?: string
}): Promise<FixedCostMonthResolution> {
  return FixedCostMonthResolutionRepository.resolve({
    referenceYear: params.reference_year,
    referenceMonth: params.reference_month,
    companyId: params.company_id,
  })
}
