import { HttpError, notFound } from '../../errors.ts'
import { getFixedCostMonthActivity, type FixedCostMonthActivityReason } from '../../fixed-cost-month-activity.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'
import { FixedCostMonthRepository } from '../../repositories/fixed-cost-month.repository.ts'
import { FixedCostMonthResolutionRepository } from '../../repositories/fixed-cost-month-resolution.repository.ts'
import type { FixedCostMonthResolution } from '../../../_shared/domain/index.ts'
import type { UpsertFixedCostMonthEntryDto } from '../../validation/fixed-cost-month.schemas.ts'

export type FixedCostMonthEntryEditErrorReason =
  | 'month_closed'
  | 'inactive'
  | 'before_start_date'
  | 'after_end_date'
  | 'negative_month_total'

export class FixedCostMonthEntryEditError extends HttpError {
  constructor(
    status: number,
    message: string,
    public readonly reason: FixedCostMonthEntryEditErrorReason,
  ) {
    super(status, message)
    this.name = 'FixedCostMonthEntryEditError'
  }
}

function fixedCostMonthInactiveError(reason: FixedCostMonthActivityReason): FixedCostMonthEntryEditError {
  if (reason === 'inactive') {
    return new FixedCostMonthEntryEditError(400, 'Este custo está inativo no cadastro recorrente.', 'inactive')
  }

  if (reason === 'before_start_date') {
    return new FixedCostMonthEntryEditError(400, 'Este custo começa depois do mês selecionado.', 'before_start_date')
  }

  if (reason === 'after_end_date') {
    return new FixedCostMonthEntryEditError(400, 'Este custo terminou antes do mês selecionado.', 'after_end_date')
  }

  const exhaustiveReason: never = reason
  throw new Error(`Unhandled fixed cost month inactivity reason: ${exhaustiveReason}`)
}

export async function upsertFixedCostMonthEntry(params: {
  fixedCostId: string
  referenceYear: number
  referenceMonth: number
  dto: UpsertFixedCostMonthEntryDto
}): Promise<FixedCostMonthResolution> {
  const fixedCost = await FixedCostRepository.findById(params.fixedCostId)
  if (!fixedCost) throw notFound('FixedCost', params.fixedCostId)

  const month = await FixedCostMonthRepository.findMonth({
    referenceYear: params.referenceYear,
    referenceMonth: params.referenceMonth,
    companyId: fixedCost.company_id ?? undefined,
  })
  const hasClosedMonth = month.status === 'closed' || await FixedCostMonthRepository.hasClosedMonth({
    referenceYear: params.referenceYear,
    referenceMonth: params.referenceMonth,
    companyId: fixedCost.company_id,
  })
  if (hasClosedMonth) {
    throw new FixedCostMonthEntryEditError(409, 'Este mês está fechado para edição comum.', 'month_closed')
  }

  const existing = await FixedCostMonthRepository.findEntry({
    fixedCostId: params.fixedCostId,
    referenceYear: params.referenceYear,
    referenceMonth: params.referenceMonth,
  })
  if (existing?.status === 'closed') {
    throw new FixedCostMonthEntryEditError(409, 'Este mês está fechado para edição comum.', 'month_closed')
  }

  const fixedCostMonthActivity = getFixedCostMonthActivity({
    active: fixedCost.active,
    startDate: fixedCost.start_date,
    endDate: fixedCost.end_date,
    referenceYear: params.referenceYear,
    referenceMonth: params.referenceMonth,
  })

  if (!fixedCostMonthActivity.isActiveForMonth) {
    throw fixedCostMonthInactiveError(fixedCostMonthActivity.reason ?? 'inactive')
  }

  const interestAmount = params.dto.interest_amount ?? existing?.interest_amount ?? 0
  const monthlyAmount = params.dto.included === false ? 0 : params.dto.amount + interestAmount
  if (monthlyAmount < 0) {
    throw new FixedCostMonthEntryEditError(
      400,
      'O desconto não pode deixar o total do mês negativo.',
      'negative_month_total',
    )
  }

  await FixedCostMonthRepository.upsertEntry({
    fixedCost,
    referenceYear: params.referenceYear,
    referenceMonth: params.referenceMonth,
    amount: params.dto.amount,
    interestAmount,
    dueDay: params.dto.due_day ?? existing?.due_day ?? fixedCost.due_day,
    name: params.dto.name ?? existing?.name ?? fixedCost.name,
    category: params.dto.category !== undefined ? params.dto.category : existing?.category ?? fixedCost.category ?? null,
    included: params.dto.included ?? existing?.included ?? true,
  })

  return FixedCostMonthResolutionRepository.resolve({
    referenceYear: params.referenceYear,
    referenceMonth: params.referenceMonth,
    companyId: fixedCost.company_id ?? undefined,
  })
}
