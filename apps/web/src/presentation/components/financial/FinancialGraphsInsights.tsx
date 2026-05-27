'use client'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type HistoricalPoint = {
  month: string
  income: number
  expense: number
  balance: number
  momIncome: number | null
  momExpense: number | null
  momBalance: number | null
}

type ExpensePoint = {
  month: string
  fixed: number
  variable: number
}

type ForecastPoint = {
  month: string
  income: number
  expense: number
  balance: number
  isNegative: boolean
}

function formatMonthRange(first?: string, last?: string) {
  if (!first || !last) return 'Sem período'
  if (first === last) return first
  return `${first} a ${last}`
}

export function FinancialGraphsInsights({
  activeChart,
  historicalData,
  expenseData,
  forecastData,
}: {
  activeChart: 'historical' | 'expense' | 'forecast'
  historicalData: HistoricalPoint[]
  expenseData: ExpensePoint[]
  forecastData: ForecastPoint[]
}) {
  if (activeChart === 'historical') {
    const first = historicalData[0]
    const last = historicalData[historicalData.length - 1]
    return (
      <p className="text-sm text-gray-600">
        Período: {formatMonthRange(first?.month, last?.month)}. Último saldo: <span className="font-medium text-gray-900">{last ? currencyFormatter.format(last.balance) : '—'}</span>.
      </p>
    )
  }

  if (activeChart === 'expense') {
    const totals = expenseData.reduce(
      (acc, row) => ({ fixed: acc.fixed + row.fixed, variable: acc.variable + row.variable }),
      { fixed: 0, variable: 0 },
    )
    const total = totals.fixed + totals.variable
    const fixedPct = total > 0 ? (totals.fixed / total) * 100 : 0
    const variablePct = total > 0 ? (totals.variable / total) * 100 : 0
    return (
      <p className="text-sm text-gray-600">
        Composição acumulada no período: fixo <span className="font-medium text-gray-900">{fixedPct.toFixed(1)}%</span> e variável <span className="font-medium text-gray-900">{variablePct.toFixed(1)}%</span>.
      </p>
    )
  }

  const first = forecastData[0]
  const last = forecastData[forecastData.length - 1]
  const negativeMonths = forecastData.filter((row) => row.isNegative).length
  return (
    <p className="text-sm text-gray-600">
      Projeção: {formatMonthRange(first?.month, last?.month)}. Meses com saldo negativo: <span className="font-medium text-gray-900">{negativeMonths}</span>.
    </p>
  )
}
