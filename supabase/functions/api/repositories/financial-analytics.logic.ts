export type HistoricalSourceRow = {
  month: string
  income: number
  fixed_expense: number
  variable_expense: number
}

export type HistoricalMonth = {
  month: string
  income: number
  fixed_expense: number
  variable_expense: number
  expense: number
  balance: number
}

export function percentageMonthOverMonth(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

export function monthStart(date: string): Date {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1))
}

export function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`
}

export function addMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1))
}

export function resolveMonthlyDueDate(year: number, month: number, dueDay: number): string {
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const resolvedDay = Math.min(dueDay, lastDayOfMonth)
  return `${year}-${String(month).padStart(2, '0')}-${String(resolvedDay).padStart(2, '0')}`
}

export function listMonths(from: string, to: string): string[] {
  const start = monthStart(from)
  const end = monthStart(to)
  const result: string[] = []
  let cursor = start
  while (cursor <= end) {
    result.push(formatMonth(cursor))
    cursor = addMonths(cursor, 1)
  }
  return result
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((acc, value) => acc + value, 0) / values.length
}

export function buildHistoricalBase(periodMonths: string[], sourceRows: HistoricalSourceRow[]): HistoricalMonth[] {
  if (sourceRows.length === 0) return []

  const monthAccumulator = new Map<string, { income: number; fixed_expense: number; variable_expense: number }>()
  for (const month of periodMonths) {
    monthAccumulator.set(month, { income: 0, fixed_expense: 0, variable_expense: 0 })
  }

  for (const row of sourceRows) {
    const month = row.month.slice(0, 10)
    const current = monthAccumulator.get(month) ?? { income: 0, fixed_expense: 0, variable_expense: 0 }
    monthAccumulator.set(month, {
      income: current.income + row.income,
      fixed_expense: current.fixed_expense + row.fixed_expense,
      variable_expense: current.variable_expense + row.variable_expense,
    })
  }

  return periodMonths.map((month) => {
    const values = monthAccumulator.get(month) ?? { income: 0, fixed_expense: 0, variable_expense: 0 }
    const expense = values.fixed_expense + values.variable_expense
    return {
      month,
      income: values.income,
      fixed_expense: values.fixed_expense,
      variable_expense: values.variable_expense,
      expense,
      balance: values.income - expense,
    }
  })
}

export function resolveTrendValues(historicalBase: HistoricalMonth[]): {
  trendIncome: number
  trendVariableExpense: number
} {
  const recentMonths = historicalBase.slice(-3)
  return {
    trendIncome: average(recentMonths.map((month) => month.income)),
    trendVariableExpense: average(recentMonths.map((month) => month.variable_expense)),
  }
}
