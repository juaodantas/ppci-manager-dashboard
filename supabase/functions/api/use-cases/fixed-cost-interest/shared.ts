import { badRequest, notFound } from '../../errors.ts'
import { getFixedCostMonthActivity } from '../../fixed-cost-month-activity.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'

export async function assertFixedCostCompetence(fixedCostId: string, referenceYear: number, referenceMonth: number): Promise<void> {
  const fixedCost = await FixedCostRepository.findById(fixedCostId)
  if (!fixedCost) {
    throw notFound('FixedCost', fixedCostId)
  }

  const fixedCostMonthActivity = getFixedCostMonthActivity({
    active: true,
    startDate: fixedCost.start_date,
    endDate: fixedCost.end_date,
    referenceYear,
    referenceMonth,
  })

  if (!fixedCostMonthActivity.isActiveForMonth) {
    throw badRequest('Mês selecionado fora do período de vigência do custo fixo')
  }
}
