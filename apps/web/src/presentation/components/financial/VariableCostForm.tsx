'use client'

import { useState } from 'react'
import type { VariableCost } from '@manager/domain'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import type { CreateVariableCostDto } from '../../../domain/repositories/variable-cost.repository'

export function VariableCostForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  companyOptions,
}: {
  initial?: VariableCost
  onSubmit: (dto: CreateVariableCostDto) => void
  onCancel: () => void
  loading: boolean
  companyOptions: { value: string; label: string }[]
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(String(initial?.amount ?? ''))
  const [date, setDate] = useState(initial?.date ?? '')
  const [interestAmount, setInterestAmount] = useState(String(initial?.interest_amount ?? 0))
  const [category, setCategory] = useState(initial?.category ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [companyId, setCompanyId] = useState(initial?.company_id ?? '')

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, amount: parseFloat(amount), interest_amount: parseFloat(interestAmount || '0'), date, category: category || undefined, description: description || undefined, company_id: companyId || undefined }) }} className="flex flex-col gap-4">
      <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Valor *" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <Input label="Juros" type="number" min="0" step="0.01" value={interestAmount} onChange={(e) => setInterestAmount(e.target.value)} required />
      <Input label="Data *" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <Input label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
      <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Select label="Empresa" options={companyOptions} value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}
