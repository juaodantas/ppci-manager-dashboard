'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type {
  FixedCostInterest,
  CreateFixedCostInterestDto,
  UpdateFixedCostInterestDto,
} from '../../../domain/repositories/fixed-cost.repository'

export function FixedCostInterestForm({
  initial,
  referenceYear,
  referenceMonth,
  onSubmit,
  loading,
}: {
  initial?: FixedCostInterest
  referenceYear: number
  referenceMonth: number
  onSubmit: (dto: CreateFixedCostInterestDto | UpdateFixedCostInterestDto) => Promise<void>
  loading: boolean
}) {
  const [year, setYear] = useState(String(initial?.reference_year ?? referenceYear))
  const [month, setMonth] = useState(String(initial?.reference_month ?? referenceMonth))
  const [interestAmount, setInterestAmount] = useState(String(initial?.interest_amount ?? 0))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void onSubmit({
          reference_year: parseInt(year),
          reference_month: parseInt(month),
          interest_amount: parseFloat(interestAmount),
        })
      }}
      className="flex flex-col gap-4"
    >
      <Input label="Ano *" type="number" min="1900" max="9999" value={year} onChange={(e) => setYear(e.target.value)} required />
      <Input label="Mês *" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} required />
      <Input label="Valor adicional de juros *" type="number" min="0" step="0.01" value={interestAmount} onChange={(e) => setInterestAmount(e.target.value)} required />
      <Button type="submit" loading={loading}>Salvar juros</Button>
    </form>
  )
}
