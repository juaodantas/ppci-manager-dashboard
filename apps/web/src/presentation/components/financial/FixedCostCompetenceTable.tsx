'use client'

import type { FixedCostMonthlyLine } from '../../../domain/repositories/fixed-cost-month.repository'
import { FixedCostCompetenceRow } from './FixedCostCompetenceRow'

export function FixedCostCompetenceTable({
  lines,
  loading,
  locked,
  onEdit,
}: {
  lines?: FixedCostMonthlyLine[]
  loading: boolean
  locked: boolean
  onEdit: (line: FixedCostMonthlyLine) => void
}) {
  const items = lines ?? []

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b px-6 py-4">
        <h2 className="font-medium text-gray-900">Gestão mensal dos custos fixos</h2>
      </div>
      <div className="max-h-[32rem] overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Custo</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Base mensal</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Desconto/Acréscimo</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor do mês</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status/origem</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && <tr><td colSpan={6} className="py-6 text-center text-gray-400">Carregando mês selecionado…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-400">Nenhum custo fixo ativo neste mês</td></tr>}
            {!loading && items.map((line) => <FixedCostCompetenceRow key={line.id} line={line} locked={locked} onEdit={onEdit} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
