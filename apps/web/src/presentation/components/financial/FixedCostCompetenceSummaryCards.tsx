'use client'

import type { FixedCostMonthResolution } from '../../../domain/repositories/fixed-cost-month.repository'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function FixedCostCompetenceSummaryCards({ resolution }: { resolution?: FixedCostMonthResolution }) {
  const summary = resolution?.summary

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-xs font-medium uppercase text-gray-500">Linhas do mês</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{resolution?.items.length ?? 0}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-xs font-medium uppercase text-gray-500">Base mensal</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{currencyFormatter.format(summary?.total_base_amount ?? 0)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-xs font-medium uppercase text-gray-500">Descontos/Acréscimos</p>
        <p className="mt-2 text-2xl font-bold text-amber-600">{currencyFormatter.format(summary?.total_interest_amount ?? 0)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-xs font-medium uppercase text-gray-500">Valor do mês</p>
        <p className="mt-2 text-2xl font-bold text-red-600">{currencyFormatter.format(summary?.total_monthly_amount ?? 0)}</p>
      </div>
    </div>
  )
}
