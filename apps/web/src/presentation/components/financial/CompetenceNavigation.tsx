'use client'

import { Button } from '../ui/Button'

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const shortMonthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' })

function formatSelectedMonth(year: number, month: number) {
  return monthFormatter.format(new Date(year, month - 1, 1))
}

function formatMonth(year: number, month: number) {
  return shortMonthFormatter.format(new Date(year, month - 1, 1))
}

export function CompetenceNavigation({
  year,
  month,
  previous,
  next,
  onPrevious,
  onNext,
}: {
  year: number
  month: number
  previous: { year: number; month: number }
  next: { year: number; month: number }
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">Mês selecionado</p>
        <p className="text-xl font-semibold capitalize text-gray-900">{formatSelectedMonth(year, month)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onPrevious}>← {formatMonth(previous.year, previous.month)}</Button>
        <Button type="button" variant="ghost" disabled className="capitalize">{formatSelectedMonth(year, month)}</Button>
        <Button type="button" variant="secondary" onClick={onNext}>{formatMonth(next.year, next.month)} →</Button>
      </div>
    </div>
  )
}
