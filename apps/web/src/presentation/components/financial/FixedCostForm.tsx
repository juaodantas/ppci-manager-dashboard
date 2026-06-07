'use client'

import { useState } from 'react'
import type { FixedCost } from '@manager/domain'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import type { CreateFixedCostDto } from '../../../domain/repositories/fixed-cost.repository'

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function FixedCostForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  companyOptions,
}: {
  initial?: FixedCost
  onSubmit: (dto: CreateFixedCostDto) => void
  onCancel: () => void
  loading: boolean
  companyOptions: { value: string; label: string }[]
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(String(initial?.amount ?? ''))
  const [dueDay, setDueDay] = useState(String(initial?.due_day ?? ''))
  const [category, setCategory] = useState(initial?.category ?? '')
  const [companyId, setCompanyId] = useState(initial?.company_id ?? '')
  const [startDate, setStartDate] = useState(
    initial?.start_date ?? formatLocalDate(new Date()),
  )
  const [endDate, setEndDate] = useState(initial?.end_date ?? '')
  const [isIndeterminate, setIsIndeterminate] = useState(initial?.end_date == null)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          name,
          amount: parseFloat(amount),
          due_day: parseInt(dueDay),
          category: category || undefined,
          start_date: startDate,
          end_date: endDate === '' ? null : endDate,
          company_id: companyId || undefined,
        })
      }}
      className="flex flex-col gap-4"
    >
      {initial && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Você está editando o cadastro recorrente. Meses sem ajuste próprio podem usar este novo valor.
        </p>
      )}
      <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Valor *" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <Input label="Dia de vencimento *" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
      <Input label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
      <Select label="Empresa" options={companyOptions} value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
      <Input label="Início da vigência *" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={isIndeterminate}
            onChange={(e) => setIsIndeterminate(e.target.checked)}
            className="rounded"
          />
          Indeterminado
        </label>
        <Input
          label="Fim da vigência"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={isIndeterminate}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}
