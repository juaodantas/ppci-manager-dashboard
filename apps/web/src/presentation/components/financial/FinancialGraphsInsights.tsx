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

function buildHistoricalRecommendation(data: HistoricalPoint[]) {
  const last = data[data.length - 1]
  if (!last) return 'Ainda não há dados suficientes para apontar uma tendência.'

  const previous = data[data.length - 2]
  if (last.balance < 0) return 'Vale revisar despesas e reforçar receitas para recuperar o saldo.'
  if (last.balance === 0) return 'O saldo mais recente está zerado; acompanhe receitas e despesas para evitar queda.'
  if (previous && last.expense > previous.expense) return 'As despesas subiram no último mês; acompanhe os gastos que mais cresceram.'
  if (previous && last.balance < previous.balance) return 'O saldo caiu no último mês; acompanhe se isso se repete antes de agir.'
  return 'O saldo mais recente está positivo; mantenha o acompanhamento para confirmar a tendência.'
}

function buildExpenseRecommendation(fixedTotal: number, variableTotal: number) {
  const total = fixedTotal + variableTotal
  if (total <= 0) return 'Ainda não há despesas suficientes para comparar fixas e variáveis.'
  if (fixedTotal > variableTotal) return 'As despesas fixas pesam mais; vale revisar contratos e gastos recorrentes.'
  if (variableTotal > fixedTotal) return 'As despesas variáveis pesam mais; confira oscilações e compras fora do padrão.'
  return 'Fixas e variáveis estão equilibradas; acompanhe se algum grupo começar a crescer.'
}

function buildForecastRecommendation(data: ForecastPoint[]) {
  if (data.length === 0) return 'Ainda não há dados suficientes para estimar os próximos meses.'

  const negativeMonths = data.filter((row) => row.isNegative)
  if (negativeMonths.length > 0) {
    const firstNegativeMonth = negativeMonths[0]?.month
    return `Há saldo negativo estimado${firstNegativeMonth ? ` a partir de ${firstNegativeMonth}` : ''}; planeje caixa, revise despesas ou antecipe receitas.`
  }

  return 'A estimativa não mostra saldo negativo, mas continue acompanhando porque projeções podem mudar.'
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
      <div className="space-y-1 text-sm text-gray-600">
        <p>
          {first && last
            ? `Este gráfico compara receitas, despesas e saldo de cada mês no período de ${formatMonthRange(first.month, last.month)}.`
            : 'Este gráfico compara receitas, despesas e saldo quando houver dados suficientes.'}
        </p>
        <p>
          Saldo mais recente: <span className="font-medium text-gray-900">{last ? currencyFormatter.format(last.balance) : '—'}</span>. {buildHistoricalRecommendation(historicalData)}
        </p>
      </div>
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
      <div className="space-y-1 text-sm text-gray-600">
        <p>Despesas fixas são recorrentes; variáveis mudam conforme o uso ou compras do mês.</p>
        <p>
          No período, fixas representam <span className="font-medium text-gray-900">{fixedPct.toFixed(1)}%</span> e variáveis <span className="font-medium text-gray-900">{variablePct.toFixed(1)}%</span>. {buildExpenseRecommendation(totals.fixed, totals.variable)}
        </p>
      </div>
    )
  }

  const first = forecastData[0]
  const last = forecastData[forecastData.length - 1]
  const negativeMonths = forecastData.filter((row) => row.isNegative).length
  return (
    <div className="space-y-1 text-sm text-gray-600">
      <p>
        {first && last
          ? `Esta é uma estimativa para ${formatMonthRange(first.month, last.month)}, não um valor garantido.`
          : 'A estimativa dos próximos meses aparecerá quando houver dados suficientes.'}
      </p>
      <p>
        Meses com saldo negativo estimado: <span className="font-medium text-gray-900">{negativeMonths}</span>. {buildForecastRecommendation(forecastData)}
      </p>
    </div>
  )
}
