'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import type { FinancialAnalytics } from '@manager/domain'
import { FinancialGraphsCarousel } from './FinancialGraphsCarousel'
import { FinancialGraphsInsights } from './FinancialGraphsInsights'
import { HistoricalTooltip, ExpenseTooltip, ForecastTooltip, ForecastDot } from './FinancialGraphsTooltip'

type FinancialGraphsProps = {
  analytics: FinancialAnalytics
  formatMonthLabel: (month: string) => string
}

const chartCards = ['historical', 'expense', 'forecast'] as const
type ChartCard = (typeof chartCards)[number]

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

const chartTitles: Record<ChartCard, string> = {
  historical: 'Receitas, despesas e saldo mês a mês',
  expense: 'Como as despesas se dividem',
  forecast: 'Estimativa para os próximos 12 meses',
}

export function FinancialGraphs({ analytics, formatMonthLabel }: FinancialGraphsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeChart = chartCards[activeIndex]

  const historicalData = useMemo<HistoricalPoint[]>(
    () => analytics.historical_by_month.map((row) => ({
      month: formatMonthLabel(row.month),
      income: row.income,
      expense: row.expense,
      balance: row.balance,
      momIncome: row.mom_income_pct,
      momExpense: row.mom_expense_pct,
      momBalance: row.mom_balance_pct,
    })),
    [analytics.historical_by_month, formatMonthLabel],
  )

  const expenseData = useMemo<ExpensePoint[]>(
    () => analytics.expense_composition_by_month.map((row) => ({
      month: formatMonthLabel(row.month),
      fixed: row.fixed_expense,
      variable: row.variable_expense,
    })),
    [analytics.expense_composition_by_month, formatMonthLabel],
  )

  const forecastData = useMemo<ForecastPoint[]>(
    () => analytics.forecast_by_month.map((row) => ({
      month: formatMonthLabel(row.month),
      income: row.forecast_income,
      expense: row.forecast_expense,
      balance: row.forecast_balance,
      isNegative: row.is_negative_balance,
    })),
    [analytics.forecast_by_month, formatMonthLabel],
  )

  return (
    <section className="flex flex-col gap-4" aria-label="Gráficos financeiros explicados em linguagem simples">
      <FinancialGraphsCarousel
        activeIndex={activeIndex}
        total={chartCards.length}
        title={chartTitles[activeChart]}
        onPrevious={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
        onNext={() => setActiveIndex((prev) => Math.min(prev + 1, chartCards.length - 1))}
        onSelect={setActiveIndex}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Resumo em linguagem simples</h3>
          <FinancialGraphsInsights
            activeChart={activeChart}
            historicalData={historicalData}
            expenseData={expenseData}
            forecastData={forecastData}
          />
        </div>

        {activeChart === 'historical' && (
          <div className="h-80" role="region" aria-label="Comparação mensal de receitas, despesas, saldo e variação mês a mês">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                />
                <Tooltip content={<HistoricalTooltip />} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} name="Receitas do mês" />
                <Line yAxisId="left" type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} name="Despesas do mês" />
                <Line yAxisId="left" type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} name="Saldo do mês" />
                <Line yAxisId="right" type="monotone" dataKey="momIncome" stroke="#16a34a" strokeDasharray="4 4" name="Variação mês a mês da receita (%)" />
                <Line yAxisId="right" type="monotone" dataKey="momExpense" stroke="#dc2626" strokeDasharray="4 4" name="Variação mês a mês da despesa (%)" />
                <Line yAxisId="right" type="monotone" dataKey="momBalance" stroke="#2563eb" strokeDasharray="4 4" name="Variação mês a mês do saldo (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeChart === 'expense' && (
          <div className="h-80" role="region" aria-label="Comparação entre despesas fixas recorrentes e despesas variáveis do mês">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ExpenseTooltip />} />
                <Legend />
                <Bar dataKey="fixed" stackId="expense" fill="#f97316" name="Despesas fixas" />
                <Bar dataKey="variable" stackId="expense" fill="#0ea5e9" name="Despesas variáveis" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeChart === 'forecast' && (
          <div className="h-80" role="region" aria-label="Estimativa de receitas, despesas e saldo para os próximos 12 meses">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ForecastTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} name="Receitas estimadas" />
                <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} name="Despesas estimadas" />
                <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} name="Saldo estimado" dot={ForecastDot} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Alguns elementos internos dos gráficos do Recharts têm navegação por teclado limitada; os resumos textuais acima cobrem os principais insights para leitura assistiva.
      </p>
    </section>
  )
}
