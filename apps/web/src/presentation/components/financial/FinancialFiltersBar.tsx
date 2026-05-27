'use client'

import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

export function FinancialFiltersBar({
  dateFrom,
  dateTo,
  companyId,
  companyOptions,
  onDateFromChange,
  onDateToChange,
  onCompanyChange,
}: {
  dateFrom: string
  dateTo: string
  companyId: string
  companyOptions: { value: string; label: string }[]
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onCompanyChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] md:flex md:items-end">
        <Input
          label="Data inicial"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
        <span className="hidden pb-2 text-gray-400 sm:block">até</span>
        <Input
          label="Data final"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
        <Select
          label="Empresa"
          options={companyOptions}
          value={companyId}
          onChange={(e) => onCompanyChange(e.target.value)}
          className="w-full md:w-64"
        />
      </div>
    </div>
  )
}
