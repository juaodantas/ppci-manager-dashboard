'use client'

import type { FixedCostInterest } from '../../../domain/repositories/fixed-cost.repository'
import { Button } from '../ui/Button'

export function FixedCostInterestSection({
  competenceYear,
  interests,
  onEdit,
  onDelete,
}: {
  competenceYear: number
  interests?: FixedCostInterest[]
  onEdit: (interest: FixedCostInterest) => void
  onDelete: (interest: FixedCostInterest) => Promise<void>
}) {
  return (
    <div className="rounded border border-gray-200">
      <div className="border-b px-4 py-2 text-sm font-medium text-gray-700">Juros cadastrados ({competenceYear})</div>
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Mês</th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Juros</th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {(interests ?? []).length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-400">Nenhum juros cadastrado para o ano selecionado</td>
            </tr>
          )}
          {(interests ?? []).map((interest) => (
            <tr key={interest.id}>
              <td className="px-4 py-2 text-sm text-gray-700">{String(interest.reference_month).padStart(2, '0')}/{interest.reference_year}</td>
              <td className="px-4 py-2 text-right text-sm text-gray-700">{interest.interest_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td className="px-4 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onEdit(interest)}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => { void onDelete(interest) }}>
                    Remover
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
