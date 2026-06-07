'use client'

import type { FixedCost } from '@manager/domain'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function toCurrencyValue(value: number) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export function FixedCostsSummaryCards({
  fixedCosts,
  competenceYear,
  competenceMonth,
}: {
  fixedCosts?: FixedCost[]
  competenceYear: number
  competenceMonth: number
}) {
  const costs = fixedCosts ?? []
  const baseTotal = costs.reduce((total, cost) => total + toCurrencyValue(cost.amount), 0)
  const competence = `${String(competenceMonth).padStart(2, '0')}/${competenceYear}`

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Custos cadastrados</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{costs.length}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Total base mensal</p>
        <p className="mt-2 text-2xl font-bold text-red-600">{currencyFormatter.format(baseTotal)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Mês</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{competence}</p>
      </div>
    </div>
  )
}
