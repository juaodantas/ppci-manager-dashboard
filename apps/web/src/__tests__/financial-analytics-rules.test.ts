import { describe, expect, it } from 'vitest'
import {
  buildHistoricalBase,
  listMonths,
  percentageMonthOverMonth,
  resolveMonthlyDueDate,
  resolveTrendValues,
} from '../../../../supabase/functions/api/repositories/financial-analytics.logic'
import { isCompanyInScope } from '../../../../supabase/functions/api/routes/financial-analytics.auth'
import { resolveHorizonMonths } from '../../../../supabase/functions/api/routes/financial-analytics.query'
import {
  buildFinancialAnalyticsParams,
  buildFinancialAnalyticsQueryKey,
} from '../presentation/hooks/useFinancial'

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

  it('clamps fixed cost due date to the last valid day of the month', () => {
    expect(resolveMonthlyDueDate(2026, 4, 31)).toBe('2026-04-30')
    expect(resolveMonthlyDueDate(2026, 2, 30)).toBe('2026-02-28')
    expect(resolveMonthlyDueDate(2028, 2, 29)).toBe('2028-02-29')
    expect(resolveMonthlyDueDate(2026, 5, 31)).toBe('2026-05-31')
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

  it('omits company_id for aggregate analytics params', () => {
    expect(buildFinancialAnalyticsParams({
      company_id: '',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
      horizon_months: 12,
    })).toEqual({
      date_from: '2026-01-01',
      date_to: '2026-01-31',
      horizon_months: 12,
    })
  })

  it('preserves company_id for company-specific analytics params', () => {
    expect(buildFinancialAnalyticsParams({
      company_id: 'company-1',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
    })).toEqual({
      company_id: 'company-1',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
      horizon_months: undefined,
    })
  })

  it('uses different query keys for aggregate and company-specific analytics', () => {
    const aggregateKey = buildFinancialAnalyticsQueryKey({
      date_from: '2026-01-01',
      date_to: '2026-01-31',
      horizon_months: 12,
    })
    const companyKey = buildFinancialAnalyticsQueryKey({
      company_id: 'company-1',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
      horizon_months: 12,
    })

    expect(aggregateKey).not.toEqual(companyKey)
    expect(aggregateKey[2]).toEqual({ scope: 'all' })
    expect(companyKey[2]).toEqual({ scope: 'company', company_id: 'company-1' })
  })
})
