'use client'

import type { FixedCost } from '@manager/domain'
import { Button } from '../ui/Button'
import { FixedCostRow } from './FixedCostRow'

export function FixedCostsSection({
  fixedCosts,
  competenceYear,
  competenceMonth,
  onOpenCreate,
  onOpenInterestModal,
  onEdit,
  onDelete,
}: {
  fixedCosts?: FixedCost[]
  competenceYear: number
  competenceMonth: number
  onOpenCreate: () => void
  onOpenInterestModal: (cost: FixedCost) => void
  onEdit: (cost: FixedCost) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="font-medium text-gray-900">Custos Fixos</h2>
        <p className="text-xs text-gray-500">Competência aplicada: {String(competenceMonth).padStart(2, '0')}/{competenceYear}</p>
        <Button size="sm" onClick={onOpenCreate}>+ Novo Custo Fixo</Button>
      </div>
      <div className="max-h-[32rem] overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categoria</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dia</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Juros competência</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {(fixedCosts ?? []).length === 0 && (
            <tr><td colSpan={6} className="py-6 text-center text-gray-400">Nenhum custo fixo cadastrado</td></tr>
          )}
          {(fixedCosts ?? []).map((fc) => (
            <FixedCostRow
              key={fc.id}
              fixedCost={fc}
              referenceYear={competenceYear}
              referenceMonth={competenceMonth}
              onOpenInterestModal={onOpenInterestModal}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
