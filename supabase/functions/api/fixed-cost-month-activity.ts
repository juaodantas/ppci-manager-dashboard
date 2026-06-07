export type SupportedDateValue =
  | string
  | Date
  | { toISOString(): string }
  | { valueOf(): string | number | Date }

export type FixedCostMonthActivityReason = 'inactive' | 'before_start_date' | 'after_end_date'

type FixedCostMonthActivityInput = {
  active: boolean
  startDate: SupportedDateValue
  endDate: SupportedDateValue | null
  referenceYear: number
  referenceMonth: number
}

function startOfMonth(referenceYear: number, referenceMonth: number): Date {
  return new Date(Date.UTC(referenceYear, referenceMonth - 1, 1))
}

function endOfMonth(referenceYear: number, referenceMonth: number): Date {
  return new Date(Date.UTC(referenceYear, referenceMonth, 0))
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeDate(value: SupportedDateValue): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
  }

  if (typeof value === 'string') {
    const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value
    const parsed = new Date(normalizedValue)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date value: ${value}`)
    }
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
  }

  if (isObject(value) && 'toISOString' in value && typeof value.toISOString === 'function') {
    return normalizeDate(value.toISOString())
  }

  if (isObject(value) && 'valueOf' in value && typeof value.valueOf === 'function') {
    const primitiveValue = value.valueOf()
    if (primitiveValue instanceof Date || typeof primitiveValue === 'string') {
      return normalizeDate(primitiveValue)
    }
    if (typeof primitiveValue === 'number') {
      const parsed = new Date(primitiveValue)
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid date value: ${primitiveValue}`)
      }
      return normalizeDate(parsed)
    }
  }

  throw new Error('Unsupported date value')
}

export function getFixedCostMonthActivity(params: FixedCostMonthActivityInput): {
  isActiveForMonth: boolean
  reason?: FixedCostMonthActivityReason
} {
  if (!params.active) {
    return { isActiveForMonth: false, reason: 'inactive' }
  }

  const monthStart = startOfMonth(params.referenceYear, params.referenceMonth)
  const monthEnd = endOfMonth(params.referenceYear, params.referenceMonth)
  const costStartDate = normalizeDate(params.startDate)

  if (monthEnd.getTime() < costStartDate.getTime()) {
    return { isActiveForMonth: false, reason: 'before_start_date' }
  }

  const costEndDate = params.endDate === null ? null : normalizeDate(params.endDate)
  if (costEndDate !== null && monthStart.getTime() > costEndDate.getTime()) {
    return { isActiveForMonth: false, reason: 'after_end_date' }
  }

  return { isActiveForMonth: true }
}
