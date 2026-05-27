import { describe, expect, it } from 'vitest'
import {
  buildHistoricalBase,
  listMonths,
  percentageMonthOverMonth,
  resolveTrendValues,
} from '../../../../supabase/functions/api/repositories/financial-analytics.logic'
import { isCompanyInScope } from '../../../../supabase/functions/api/routes/financial-analytics.auth'
import { resolveHorizonMonths } from '../../../../supabase/functions/api/routes/financial-analytics.query'

describe('financial analytics rules', () => {
  it('returns null for M/M when previous is zero', () => {
    expect(percentageMonthOverMonth(100, 0)).toBeNull()
  })

  it('uses signed M/M formula without absolute previous', () => {
    expect(percentageMonthOverMonth(80, -100)).toBe(-180)
  })

  it('returns empty historical series when period has no data', () => {
    const months = listMonths('2026-01-01', '2026-03-31')
    const historical = buildHistoricalBase(months, [])
    expect(historical).toEqual([])
  })

  it('forecast trend uses pending plus average of last 3 months', () => {
    const months = listMonths('2026-01-01', '2026-03-31')
    const historical = buildHistoricalBase(months, [
      { month: '2026-01-01', income: 100, fixed_expense: 40, variable_expense: 10 },
      { month: '2026-02-01', income: 200, fixed_expense: 40, variable_expense: 20 },
      { month: '2026-03-01', income: 300, fixed_expense: 40, variable_expense: 30 },
    ])
    const { trendIncome } = resolveTrendValues(historical)
    const pending = 50
    expect(trendIncome).toBe(200)
    expect(pending + trendIncome).toBe(250)
  })

  it('variable trend is zero when there is no variable history', () => {
    const months = listMonths('2026-01-01', '2026-03-31')
    const historical = buildHistoricalBase(months, [
      { month: '2026-01-01', income: 100, fixed_expense: 80, variable_expense: 0 },
      { month: '2026-02-01', income: 100, fixed_expense: 80, variable_expense: 0 },
      { month: '2026-03-01', income: 100, fixed_expense: 80, variable_expense: 0 },
    ])
    const { trendVariableExpense } = resolveTrendValues(historical)
    expect(trendVariableExpense).toBe(0)
  })

  it('defaults horizon to 12 and rejects out-of-range values', () => {
    expect(resolveHorizonMonths(undefined)).toBe(12)
    expect(() => resolveHorizonMonths('0')).toThrow()
    expect(() => resolveHorizonMonths('13')).toThrow()
  })

  it('denies access when company is out of scope', () => {
    expect(isCompanyInScope({ company_ids: ['a', 'b'] }, 'c')).toBe(false)
    expect(isCompanyInScope({ company_ids: ['a', 'b'] }, 'a')).toBe(true)
    expect(isCompanyInScope({}, 'any')).toBe(true)
  })
})
