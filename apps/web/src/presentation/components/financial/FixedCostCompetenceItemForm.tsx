'use client'

import { useState } from 'react'
import type { FixedCostMonthlyLine, UpdateFixedCostMonthlyEntryDto } from '../../../domain/repositories/fixed-cost-month.repository'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

type AdjustmentDirection = 'increase' | 'decrease'

function initialAdjustmentDirection(amount: number): AdjustmentDirection {
  return amount < 0 ? 'decrease' : 'increase'
}

export function FixedCostCompetenceItemForm({
  line,
  onCancel,
  onSubmit,
  loading,
}: {
  line: FixedCostMonthlyLine
  onCancel: () => void
  onSubmit: (dto: UpdateFixedCostMonthlyEntryDto) => void
  loading: boolean
}) {
  const [baseAmount, setBaseAmount] = useState(String(line.monthly_base_amount))
  const [adjustmentDirection, setAdjustmentDirection] = useState<AdjustmentDirection>(initialAdjustmentDirection(line.interest_amount))
  const [adjustmentAmount, setAdjustmentAmount] = useState(String(Math.abs(line.interest_amount)))
  const [dueDay, setDueDay] = useState(String(line.due_day))
  const [included, setIncluded] = useState(line.included)
  const [adjustmentError, setAdjustmentError] = useState('')

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const parsedAdjustmentAmount = Number(adjustmentAmount)
        if (parsedAdjustmentAmount < 0) {
          setAdjustmentError('Informe um valor positivo e escolha Desconto para reduzir o custo.')
          return
        }
        setAdjustmentError('')
        onSubmit({
          amount: Number(baseAmount),
          interest_amount: adjustmentDirection === 'decrease' ? -parsedAdjustmentAmount : parsedAdjustmentAmount,
          due_day: Number(dueDay),
          name: line.name,
          category: line.category,
          included,
        })
      }}
    >
      <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
        Você está editando apenas o mês selecionado. O cadastro recorrente e os próximos meses não serão alterados.
      </p>
      <Input label="Custo" value={line.name} disabled />
      <Input label="Valor base do mês" type="number" min="0" step="0.01" value={baseAmount} onChange={(event) => setBaseAmount(event.target.value)} required />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-gray-700">Desconto/Acréscimo</legend>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="radio"
              name="adjustment-direction"
              value="increase"
              checked={adjustmentDirection === 'increase'}
              onChange={() => setAdjustmentDirection('increase')}
            />
            Acréscimo
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="radio"
              name="adjustment-direction"
              value="decrease"
              checked={adjustmentDirection === 'decrease'}
              onChange={() => setAdjustmentDirection('decrease')}
            />
            Desconto
          </label>
        </div>
        <Input
          label="Valor do ajuste"
          type="number"
          min="0"
          step="0.01"
          value={adjustmentAmount}
          onChange={(event) => {
            const nextValue = event.target.value
            setAdjustmentAmount(nextValue.startsWith('-') ? nextValue.slice(1) : nextValue)
            if (nextValue.startsWith('-')) setAdjustmentError('Informe um valor positivo e escolha Desconto para reduzir o custo.')
          }}
          required
        />
        <p className="text-xs text-gray-500">Escolha se o valor aumenta ou reduz o custo deste mês. Informe apenas valores positivos.</p>
        {adjustmentError && <p className="text-xs text-red-600" aria-live="assertive">{adjustmentError}</p>}
      </fieldset>
      <Input label="Dia de vencimento" type="number" min="1" max="31" value={dueDay} onChange={(event) => setDueDay(event.target.value)} required />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={included} onChange={(event) => setIncluded(event.target.checked)} className="rounded" />
        Incluir custo neste mês
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar mês</Button>
      </div>
    </form>
  )
}
