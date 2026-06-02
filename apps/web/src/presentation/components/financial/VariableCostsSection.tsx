'use client'

import type { VariableCost } from '@manager/domain'
import { Button } from '../ui/Button'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function toCurrencyValue(value: number) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export function VariableCostsSection({
  variableCosts,
  onOpenCreate,
  onEdit,
  onDelete,
}: {
  variableCosts?: VariableCost[]
  onOpenCreate: () => void
  onEdit: (cost: VariableCost) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="font-medium text-gray-900">Custos Variáveis</h2>
        <Button size="sm" onClick={onOpenCreate}>+ Novo Custo</Button>
      </div>
      <div className="max-h-[32rem] overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categoria</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Juros</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {(variableCosts ?? []).length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-gray-400">Nenhum custo variável no período</td></tr>
          )}
          {(variableCosts ?? []).map((vc) => {
            const baseAmount = toCurrencyValue(vc.amount)
            const interestAmount = toCurrencyValue(vc.interest_amount)
            const totalAmount = baseAmount + interestAmount

            return (
              <tr key={vc.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{vc.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{vc.category ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(vc.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{currencyFormatter.format(baseAmount)}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{currencyFormatter.format(interestAmount)}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{currencyFormatter.format(totalAmount)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(vc)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(vc.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
