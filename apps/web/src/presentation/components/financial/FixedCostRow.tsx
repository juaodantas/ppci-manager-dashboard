'use client'

import type { FixedCost } from '@manager/domain'
import { Button } from '../ui/Button'
import { useFixedCostInterests } from '../../hooks/useFixedCosts'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function toCurrencyValue(value: number) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export function FixedCostRow({
  fixedCost,
  referenceYear,
  referenceMonth,
  onOpenInterestModal,
  onEdit,
  onDelete,
}: {
  fixedCost: FixedCost
  referenceYear: number
  referenceMonth: number
  onOpenInterestModal: (cost: FixedCost) => void
  onEdit: (cost: FixedCost) => void
  onDelete: (id: string) => void
}) {
  const { data: interests } = useFixedCostInterests(fixedCost.id, { reference_year: referenceYear })
  const selectedInterest = interests?.find((item) => item.reference_month === referenceMonth)
  const baseAmount = toCurrencyValue(fixedCost.amount)
  const interestAmount = toCurrencyValue(selectedInterest?.interest_amount ?? 0)
  const totalAmount = baseAmount + interestAmount

  return (
    <tr>
      <td className="px-6 py-4 text-sm text-gray-900">{fixedCost.name}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{fixedCost.category ?? '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-500">dia {fixedCost.due_day}</td>
      <td className="px-6 py-4 text-right text-sm text-gray-500">{currencyFormatter.format(interestAmount)}</td>
      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{currencyFormatter.format(totalAmount)}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => onOpenInterestModal(fixedCost)}>Juros</Button>
          <Button size="sm" variant="secondary" onClick={() => onEdit(fixedCost)}>Editar</Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(fixedCost.id)}>Excluir</Button>
        </div>
      </td>
    </tr>
  )
}
