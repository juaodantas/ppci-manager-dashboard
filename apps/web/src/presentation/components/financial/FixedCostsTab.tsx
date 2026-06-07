'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FixedCost } from '@manager/domain'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Button } from '../ui/Button'
import { getFixedCostMonthApiErrorMessage } from '../../utils/api-error'
import { useFixedCostCompetence } from '../../hooks/useFixedCostCompetence'
import type { FixedCostMonthlyLine, UpdateFixedCostMonthlyEntryDto } from '../../../domain/repositories/fixed-cost-month.repository'
import { CompetenceNavigation } from './CompetenceNavigation'
import { FixedCostCompetenceSummaryCards } from './FixedCostCompetenceSummaryCards'
import { FixedCostCompetenceTable } from './FixedCostCompetenceTable'
import { FixedCostCompetenceItemForm } from './FixedCostCompetenceItemForm'
import { FixedCostsSection } from './FixedCostsSection'

type FixedCostsMode = 'monthly' | 'recurring'

export type FixedCostTabCompetence = {
  year: number
  month: number
}

export function FixedCostsTab({
  companyId,
  fixedCosts,
  onOpenCreate,
  onOpenInterestModal,
  onEditRecurring,
  onDeleteRecurring,
  onCompetenceChange,
}: {
  companyId: string
  fixedCosts?: FixedCost[]
  onOpenCreate: () => void
  onOpenInterestModal: (cost: FixedCost) => void
  onEditRecurring: (cost: FixedCost) => void
  onDeleteRecurring: (id: string) => void
  onCompetenceChange: (competence: FixedCostTabCompetence) => void
}) {
  const fixedCostMonthErrorFallback = 'Não foi possível concluir a ação neste mês. Tente novamente.'
  const [mode, setMode] = useState<FixedCostsMode>('monthly')
  const [editingLine, setEditingLine] = useState<FixedCostMonthlyLine | undefined>()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const competence = useFixedCostCompetence(companyId || undefined)
  const monthStatus = competence.data?.month.status ?? 'confirmed'
  const monthLocked = monthStatus === 'closed'
  const actionLoading = competence.closeMonth.isPending
  const monthLabel = useMemo(() => {
    const date = new Date(competence.competence.year, competence.competence.month - 1, 1)
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  }, [competence.competence.month, competence.competence.year])

  useEffect(() => {
    onCompetenceChange(competence.competence)
  }, [competence.competence, onCompetenceChange])

  const handleSubmitMonthly = async (dto: UpdateFixedCostMonthlyEntryDto) => {
    if (!editingLine) return
    setErrorMessage('')
    try {
      await competence.updateEntry.mutateAsync({ line: editingLine, data: dto })
      setEditingLine(undefined)
    } catch (error: unknown) {
      setErrorMessage(getFixedCostMonthApiErrorMessage(error, fixedCostMonthErrorFallback))
    }
  }

  const handleCloseMonth = async () => {
    setErrorMessage('')
    try {
      await competence.closeMonth.mutateAsync()
      setCloseDialogOpen(false)
      setEditingLine(undefined)
    } catch (error: unknown) {
      setErrorMessage(getFixedCostMonthApiErrorMessage(error, fixedCostMonthErrorFallback))
    }
  }

  const statusLabel = monthStatus === 'closed' ? 'Fechado' : 'Disponível para edição'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Custos Fixos — <span className="capitalize">{monthLabel}</span></h2>
          <p className="mt-1 text-sm text-gray-500">Revise e ajuste os valores do mês selecionado sem alterar o cadastro recorrente.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{statusLabel}</span>
          <Button type="button" variant="danger" onClick={() => setCloseDialogOpen(true)} disabled={monthLocked || actionLoading}>Fechar mês</Button>
        </div>
      </div>

      <CompetenceNavigation
        year={competence.competence.year}
        month={competence.competence.month}
        previous={competence.previousCompetence}
        next={competence.nextCompetence}
        onPrevious={competence.goToPreviousMonth}
        onNext={competence.goToNextMonth}
      />

      <div className="flex gap-2">
        <Button type="button" variant={mode === 'monthly' ? 'primary' : 'secondary'} onClick={() => setMode('monthly')}>Gestão mensal</Button>
        <Button type="button" variant={mode === 'recurring' ? 'primary' : 'secondary'} onClick={() => setMode('recurring')}>Cadastro recorrente</Button>
      </div>

      {mode === 'monthly' && (
        <div className="flex flex-col gap-4">
          {competence.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" aria-live="assertive">
              {getFixedCostMonthApiErrorMessage(competence.error, fixedCostMonthErrorFallback)}
            </div>
          )}
          {errorMessage && !editingLine && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" aria-live="assertive">
              {errorMessage}
            </div>
          )}
          <FixedCostCompetenceSummaryCards resolution={competence.data} />
          <FixedCostCompetenceTable
            lines={competence.data?.items}
            loading={competence.isLoading}
            locked={monthLocked}
            onEdit={(line) => {
              if (!monthLocked) setEditingLine(line)
            }}
          />
        </div>
      )}

      {mode === 'recurring' && (
        <FixedCostsSection
          fixedCosts={fixedCosts}
          competenceYear={competence.competence.year}
          competenceMonth={competence.competence.month}
          onOpenCreate={onOpenCreate}
          onOpenInterestModal={onOpenInterestModal}
          onEdit={onEditRecurring}
          onDelete={onDeleteRecurring}
        />
      )}

      <Modal
        open={Boolean(editingLine)}
        title={editingLine ? `Editar ${editingLine.name} neste mês` : 'Editar custo deste mês'}
        onClose={() => { setEditingLine(undefined); setErrorMessage('') }}
      >
        {editingLine && (
          <div className="flex flex-col gap-4">
            {errorMessage && <p className="text-sm text-red-600" aria-live="assertive">{errorMessage}</p>}
            <FixedCostCompetenceItemForm
              line={editingLine}
              onCancel={() => { setEditingLine(undefined); setErrorMessage('') }}
              onSubmit={handleSubmitMonthly}
              loading={competence.updateEntry.isPending}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={closeDialogOpen}
        title="Fechar mês"
        description="Fechar o mês bloqueia novas edições comuns e mantém os valores atuais deste período."
        confirmLabel="Fechar mês"
        variant="danger"
        onCancel={() => { setCloseDialogOpen(false); setErrorMessage('') }}
        onConfirm={() => { void handleCloseMonth() }}
        loading={actionLoading}
      />
    </div>
  )
}
