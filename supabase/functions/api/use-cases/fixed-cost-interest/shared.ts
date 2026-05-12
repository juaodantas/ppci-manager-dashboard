import { badRequest, notFound } from '../../errors.ts'
import { FixedCostRepository } from '../../repositories/fixed-cost.repository.ts'

function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1))
}

function endOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0))
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function isCompetenceWithinPeriod(startDate: string, endDate: string | null, referenceYear: number, referenceMonth: number): boolean {
  const competenceStart = startOfMonth(referenceYear, referenceMonth)
  const competenceEnd = endOfMonth(referenceYear, referenceMonth)
  const costStart = parseDate(startDate)
  const costEnd = endDate ? parseDate(endDate) : null

  if (competenceEnd < costStart) return false
  if (costEnd && competenceStart > costEnd) return false
  return true
}

export async function assertFixedCostCompetence(fixedCostId: string, referenceYear: number, referenceMonth: number): Promise<void> {
  const fixedCost = await FixedCostRepository.findById(fixedCostId)
  if (!fixedCost) {
    throw notFound('FixedCost', fixedCostId)
  }

  if (!isCompetenceWithinPeriod(fixedCost.start_date, fixedCost.end_date, referenceYear, referenceMonth)) {
    throw badRequest('Competência fora do período de vigência do custo fixo')
  }
}
