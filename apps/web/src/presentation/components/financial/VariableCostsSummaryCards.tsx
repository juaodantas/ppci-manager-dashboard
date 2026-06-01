'use client'

import type { VariableCost } from '@manager/domain'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function VariableCostsSummaryCards({
  variableCosts,
}: {
  variableCosts?: VariableCost[]
}) {
  const costs = variableCosts ?? []
  const totals = costs.reduce(
    (acc, cost) => ({
      base: acc.base + cost.amount,
      interest: acc.interest + cost.interest_amount,
      total: acc.total + cost.amount + cost.interest_amount,
    }),
    { base: 0, interest: 0, total: 0 },
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Custos no período</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{costs.length}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Valor base</p>
        <p className="mt-2 text-2xl font-bold text-red-600">{currencyFormatter.format(totals.base)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Juros</p>
        <p className="mt-2 text-2xl font-bold text-orange-600">{currencyFormatter.format(totals.interest)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Total</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{currencyFormatter.format(totals.total)}</p>
      </div>
    </div>
  )
}
