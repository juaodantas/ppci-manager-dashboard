'use client'

import { useState } from 'react'
import type { FixedCost, VariableCost } from '@manager/domain'
import { Button } from '../../../presentation/components/ui/Button'
import { Input } from '../../../presentation/components/ui/Input'
import { Modal } from '../../../presentation/components/ui/Modal'
import { useFinancialReport, useFinancialEntries } from '../../../presentation/hooks/useFinancial'
import {
  useFixedCosts,
  useCreateFixedCost,
  useUpdateFixedCost,
  useDeleteFixedCost,
} from '../../../presentation/hooks/useFixedCosts'
import {
  useVariableCosts,
  useCreateVariableCost,
  useUpdateVariableCost,
  useDeleteVariableCost,
} from '../../../presentation/hooks/useVariableCosts'
import type { CreateFixedCostDto, UpdateFixedCostDto } from '../../../domain/repositories/fixed-cost.repository'
import type { CreateVariableCostDto, UpdateVariableCostDto } from '../../../domain/repositories/variable-cost.repository'

function currentMonthRange() {
  const now = new Date()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return { from, to }
}

function FixedCostForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: FixedCost
  onSubmit: (dto: CreateFixedCostDto) => void
  onCancel: () => void
  loading: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(String(initial?.amount ?? ''))
  const [dueDay, setDueDay] = useState(String(initial?.due_day ?? ''))
  const [category, setCategory] = useState(initial?.category ?? '')

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, amount: parseFloat(amount), due_day: parseInt(dueDay), category: category || undefined }) }} className="flex flex-col gap-4">
      <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Valor *" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <Input label="Dia de vencimento *" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
      <Input label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}

function VariableCostForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: VariableCost
  onSubmit: (dto: CreateVariableCostDto) => void
  onCancel: () => void
  loading: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(String(initial?.amount ?? ''))
  const [date, setDate] = useState(initial?.date ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, amount: parseFloat(amount), date, category: category || undefined, description: description || undefined }) }} className="flex flex-col gap-4">
      <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Valor *" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <Input label="Data *" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <Input label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
      <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}

export default function FinancialPage() {
  const { from, to } = currentMonthRange()
  const [dateFrom, setDateFrom] = useState(from)
  const [dateTo, setDateTo] = useState(to)
  const [fcModalOpen, setFcModalOpen] = useState(false)
  const [editingFc, setEditingFc] = useState<FixedCost | undefined>()
  const [vcModalOpen, setVcModalOpen] = useState(false)
  const [editingVc, setEditingVc] = useState<VariableCost | undefined>()

  const { data: report, isLoading: reportLoading } = useFinancialReport(dateFrom, dateTo)
  const { data: entries } = useFinancialEntries({ date_from: dateFrom, date_to: dateTo, limit: 50, offset: 0 })
  const { data: fixedCosts } = useFixedCosts()
  const { data: variableCosts } = useVariableCosts({ date_from: dateFrom, date_to: dateTo })
  const createFc = useCreateFixedCost()
  const updateFc = useUpdateFixedCost()
  const deleteFc = useDeleteFixedCost()
  const createVc = useCreateVariableCost()
  const updateVc = useUpdateVariableCost()
  const deleteVc = useDeleteVariableCost()

  const handleFcSubmit = async (dto: CreateFixedCostDto | UpdateFixedCostDto) => {
    if (editingFc) {
      await updateFc.mutateAsync({ id: editingFc.id, dto: dto as UpdateFixedCostDto })
    } else {
      await createFc.mutateAsync(dto as CreateFixedCostDto)
    }
    setFcModalOpen(false); setEditingFc(undefined)
  }

  const handleVcSubmit = async (dto: CreateVariableCostDto | UpdateVariableCostDto) => {
    if (editingVc) {
      await updateVc.mutateAsync({ id: editingVc.id, dto: dto as UpdateVariableCostDto })
    } else {
      await createVc.mutateAsync(dto as CreateVariableCostDto)
    }
    setVcModalOpen(false); setEditingVc(undefined)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <div className="flex items-center gap-3">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-gray-400">até</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {reportLoading ? (
        <div className="py-8 text-center text-gray-500">Carregando relatório...</div>
      ) : report && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-xs font-medium uppercase text-gray-500">Receitas</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{report.total_income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-xs font-medium uppercase text-gray-500">Despesas</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{report.total_expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-xs font-medium uppercase text-gray-500">Saldo</p>
            <p className={`mt-2 text-2xl font-bold ${report.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      )}

      {report && report.entries_by_month.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b px-6 py-4">
            <h2 className="font-medium text-gray-900">Por mês</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mês</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Receitas</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Despesas</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.entries_by_month.map((row) => (
                <tr key={row.month}>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(row.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                  <td className="px-6 py-4 text-right text-sm text-green-600">{row.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-6 py-4 text-right text-sm text-red-600">{row.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className={`px-6 py-4 text-right text-sm font-medium ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries && entries.entries.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b px-6 py-4">
            <h2 className="font-medium text-gray-900">Lançamentos</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descrição</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${e.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {e.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{e.description ?? e.source_type}</td>
                  <td className={`px-6 py-4 text-right text-sm font-medium ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-medium text-gray-900">Custos Variáveis</h2>
          <Button size="sm" onClick={() => setVcModalOpen(true)}>+ Novo Custo</Button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(variableCosts ?? []).length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">Nenhum custo variável no período</td></tr>
            )}
            {(variableCosts ?? []).map((vc) => (
              <tr key={vc.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{vc.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{vc.category ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(vc.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{vc.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditingVc(vc); setVcModalOpen(true) }}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteVc.mutateAsync(vc.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-medium text-gray-900">Custos Fixos</h2>
          <Button size="sm" onClick={() => setFcModalOpen(true)}>+ Novo Custo Fixo</Button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dia</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(fixedCosts ?? []).length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">Nenhum custo fixo cadastrado</td></tr>
            )}
            {(fixedCosts ?? []).map((fc) => (
              <tr key={fc.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{fc.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{fc.category ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">dia {fc.due_day}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{fc.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditingFc(fc); setFcModalOpen(true) }}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteFc.mutateAsync(fc.id)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={fcModalOpen}
        title={editingFc ? 'Editar Custo Fixo' : 'Novo Custo Fixo'}
        onClose={() => { setFcModalOpen(false); setEditingFc(undefined) }}
      >
        <FixedCostForm
          initial={editingFc}
          onSubmit={handleFcSubmit}
          onCancel={() => { setFcModalOpen(false); setEditingFc(undefined) }}
          loading={createFc.isPending || updateFc.isPending}
        />
      </Modal>

      <Modal
        open={vcModalOpen}
        title={editingVc ? 'Editar Custo Variável' : 'Novo Custo Variável'}
        onClose={() => { setVcModalOpen(false); setEditingVc(undefined) }}
      >
        <VariableCostForm
          initial={editingVc}
          onSubmit={handleVcSubmit}
          onCancel={() => { setVcModalOpen(false); setEditingVc(undefined) }}
          loading={createVc.isPending || updateVc.isPending}
        />
      </Modal>
    </div>
  )
}
