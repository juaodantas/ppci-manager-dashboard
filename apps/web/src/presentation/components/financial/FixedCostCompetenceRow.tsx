'use client'

import type { FixedCostMonthlyLine } from '../../../domain/repositories/fixed-cost-month.repository'
import { Button } from '../ui/Button'
import {
  fixedCostMonthReasonMessages,
  getFixedCostMonthLegacyMicrocopy,
  getFixedCostMonthStatusLabel,
  getFixedCostMonthStatusMicrocopy,
} from '../../utils/fixed-cost-month-copy'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function FixedCostCompetenceRow({
  line,
  locked,
  onEdit,
}: {
  line: FixedCostMonthlyLine
  locked: boolean
  onEdit: (line: FixedCostMonthlyLine) => void
}) {
  const showRecurringBase = line.recurring_base_amount !== line.monthly_base_amount
  const editDisabled = locked || !line.is_editable
  const blockMessage = line.edit_block_message ??
    (line.edit_block_reason
      ? fixedCostMonthReasonMessages[line.edit_block_reason]
      : undefined)
  const statusLabel = getFixedCostMonthStatusLabel(line)
  const statusMicrocopy = getFixedCostMonthStatusMicrocopy(line)
  const legacyMicrocopy = getFixedCostMonthLegacyMicrocopy(line)

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900">{line.name}</div>
        <div className="text-xs text-gray-500">{line.category ?? 'Sem categoria'} • venc. {line.due_day}</div>
      </td>
      <td className="px-6 py-4 text-right text-sm text-gray-700">
        <div>{currencyFormatter.format(line.monthly_base_amount)}</div>
        {showRecurringBase && <div className="text-xs text-gray-500">Cadastro: {currencyFormatter.format(line.recurring_base_amount)}</div>}
      </td>
      <td className="px-6 py-4 text-right text-sm text-gray-700">{currencyFormatter.format(line.interest_amount)}</td>
      <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">{currencyFormatter.format(line.monthly_amount)}</td>
      <td className="px-6 py-4 text-sm text-gray-700">
        {statusLabel && <div>{statusLabel}</div>}
        {statusMicrocopy && <div className="text-xs text-gray-500">{statusMicrocopy}</div>}
        {legacyMicrocopy && <div className="text-xs text-gray-500">{legacyMicrocopy}</div>}
        {blockMessage && <div className="mt-1 max-w-56 text-xs text-amber-700">{blockMessage}</div>}
      </td>
      <td className="px-6 py-4 text-right">
        <Button size="sm" variant="secondary" onClick={() => onEdit(line)} disabled={editDisabled}>Editar este mês</Button>
      </td>
    </tr>
  )
}
