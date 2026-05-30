'use client'

import type { ReactNode } from 'react'
import type {
  TooltipProps,
} from 'recharts'

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || typeof value === 'number'
}

function isHistoricalPoint(value: unknown): value is HistoricalPoint {
  if (!isRecord(value)) return false
  return (
    typeof value.month === 'string' &&
    typeof value.income === 'number' &&
    typeof value.expense === 'number' &&
    typeof value.balance === 'number' &&
    isNumberOrNull(value.momIncome) &&
    isNumberOrNull(value.momExpense) &&
    isNumberOrNull(value.momBalance)
  )
}

function isExpensePoint(value: unknown): value is ExpensePoint {
  if (!isRecord(value)) return false
  return typeof value.month === 'string' && typeof value.fixed === 'number' && typeof value.variable === 'number'
}

function isForecastPoint(value: unknown): value is ForecastPoint {
  if (!isRecord(value)) return false
  return (
    typeof value.month === 'string' &&
    typeof value.income === 'number' &&
    typeof value.expense === 'number' &&
    typeof value.balance === 'number' &&
    typeof value.isNegative === 'boolean'
  )
}

function formatPercent(value: number | null) {
  return value == null ? '—' : `${value.toFixed(2)}%`
}

function TooltipContainer({ children, label }: { children: ReactNode; label: string | number | undefined }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <p className="mb-1 font-semibold text-gray-900 dark:text-slate-100">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

export function HistoricalTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const raw: unknown = payload[0]?.payload
  if (!isHistoricalPoint(raw)) return null

  return (
    <TooltipContainer label={label}>
      <p>Receitas do mês: {currencyFormatter.format(raw.income)}</p>
      <p>Despesas do mês: {currencyFormatter.format(raw.expense)}</p>
      <p>Saldo do mês: {currencyFormatter.format(raw.balance)}</p>
      <p>Variação mês a mês da receita: {formatPercent(raw.momIncome)}</p>
      <p>Variação mês a mês da despesa: {formatPercent(raw.momExpense)}</p>
      <p>Variação mês a mês do saldo: {formatPercent(raw.momBalance)}</p>
    </TooltipContainer>
  )
}

export function ExpenseTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const raw: unknown = payload[0]?.payload
  if (!isExpensePoint(raw)) return null

  return (
    <TooltipContainer label={label}>
      <p>Despesas fixas recorrentes: {currencyFormatter.format(raw.fixed)}</p>
      <p>Despesas variáveis do mês: {currencyFormatter.format(raw.variable)}</p>
    </TooltipContainer>
  )
}

export function ForecastTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const raw: unknown = payload[0]?.payload
  if (!isForecastPoint(raw)) return null
  const balanceStatus = raw.balance < 0
    ? 'Saldo estimado abaixo de zero; vale planejar caixa.'
    : raw.balance === 0
      ? 'Saldo estimado zerado; acompanhe para evitar queda.'
      : 'Saldo estimado positivo.'

  return (
    <TooltipContainer label={label}>
      <p>Receitas estimadas: {currencyFormatter.format(raw.income)}</p>
      <p>Despesas estimadas: {currencyFormatter.format(raw.expense)}</p>
      <p>Saldo estimado: {currencyFormatter.format(raw.balance)}</p>
      <p className={raw.balance < 0 ? 'text-red-600 dark:text-red-300' : 'text-gray-700 dark:text-slate-200'}>{balanceStatus}</p>
    </TooltipContainer>
  )
}

type ForecastDotProps = {
  cx?: number
  cy?: number
  payload?: unknown
}

export function ForecastDot(props: ForecastDotProps) {
  const raw: unknown = props.payload
  const fillColor = isForecastPoint(raw) && raw.isNegative ? '#dc2626' : '#2563eb'
  if (props.cx == null || props.cy == null) {
    return <circle cx={0} cy={0} r={0} fill="transparent" stroke="none" />
  }
  return <circle cx={props.cx} cy={props.cy} r={3} fill={fillColor} stroke={fillColor} />
}
