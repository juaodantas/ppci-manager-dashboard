'use client'

import { useMemo, useState } from 'react'
import type { FixedCost, VariableCost } from '@manager/domain'
import { Modal } from '../../../presentation/components/ui/Modal'
import { ConfirmDialog } from '../../../presentation/components/ui/ConfirmDialog'
import { FinancialGraphs } from '../../../presentation/components/financial/FinancialGraphs'
import { FinancialFiltersBar } from '../../../presentation/components/financial/FinancialFiltersBar'
import { FinancialTabs } from '../../../presentation/components/financial/FinancialTabs'
import type { FinancialTab } from '../../../presentation/components/financial/FinancialTabs'
import { FinancialReportSummaryCards } from '../../../presentation/components/financial/FinancialReportSummaryCards'
import { FinancialMonthlyTable } from '../../../presentation/components/financial/FinancialMonthlyTable'
import { FinancialEntriesTable } from '../../../presentation/components/financial/FinancialEntriesTable'
import { VariableCostsSection } from '../../../presentation/components/financial/VariableCostsSection'
import { FixedCostsSection } from '../../../presentation/components/financial/FixedCostsSection'
import { VariableCostsSummaryCards } from '../../../presentation/components/financial/VariableCostsSummaryCards'
import { FixedCostsSummaryCards } from '../../../presentation/components/financial/FixedCostsSummaryCards'
import { FixedCostForm } from '../../../presentation/components/financial/FixedCostForm'
import { VariableCostForm } from '../../../presentation/components/financial/VariableCostForm'
import { FixedCostInterestForm } from '../../../presentation/components/financial/FixedCostInterestForm'
import { FixedCostInterestSection } from '../../../presentation/components/financial/FixedCostInterestSection'
import { getApiErrorMessage } from '../../../presentation/utils/api-error'
import { useFinancialAnalytics, useFinancialReport, useFinancialEntries } from '../../../presentation/hooks/useFinancial'
import {
  useFixedCosts,
  useCreateFixedCost,
  useUpdateFixedCost,
  useDeleteFixedCost,
  useFixedCostInterests,
  useCreateFixedCostInterest,
  useUpdateFixedCostInterest,
  useDeleteFixedCostInterest,
} from '../../../presentation/hooks/useFixedCosts'
import {
  useVariableCosts,
  useCreateVariableCost,
  useUpdateVariableCost,
  useDeleteVariableCost,
} from '../../../presentation/hooks/useVariableCosts'
import { useCompanies } from '../../../presentation/hooks/useCompanies'
import type {
  CreateFixedCostDto,
  UpdateFixedCostDto,
  FixedCostInterest,
  CreateFixedCostInterestDto,
  UpdateFixedCostInterestDto,
} from '../../../domain/repositories/fixed-cost.repository'
import type { CreateVariableCostDto, UpdateVariableCostDto } from '../../../domain/repositories/variable-cost.repository'

function getCompetenceFromDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
  }
}

function currentMonthRange() {
  const now = new Date()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return { from, to }
}

function formatMonthLabel(month: string) {
  return new Date(`${month}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export default function FinancialPage() {
  const { from, to } = currentMonthRange()
  const [dateFrom, setDateFrom] = useState(from)
  const [dateTo, setDateTo] = useState(to)
  const [companyId, setCompanyId] = useState('')
  const [fcModalOpen, setFcModalOpen] = useState(false)
  const [editingFc, setEditingFc] = useState<FixedCost | undefined>()
  const [vcModalOpen, setVcModalOpen] = useState(false)
  const [editingVc, setEditingVc] = useState<VariableCost | undefined>()
  const [fixedCostInterestModalOpen, setFixedCostInterestModalOpen] = useState(false)
  const [selectedFixedCost, setSelectedFixedCost] = useState<FixedCost | undefined>()
  const [editingInterest, setEditingInterest] = useState<FixedCostInterest | undefined>()
  const [interestError, setInterestError] = useState('')
  const [activeTab, setActiveTab] = useState<FinancialTab>('entries')
  const [variableCostToDelete, setVariableCostToDelete] = useState<VariableCost | undefined>()
  const [fixedCostToDelete, setFixedCostToDelete] = useState<FixedCost | undefined>()
  const [interestToDelete, setInterestToDelete] = useState<FixedCostInterest | undefined>()

  const { data: report, isLoading: reportLoading } = useFinancialReport({ date_from: dateFrom, date_to: dateTo, company_id: companyId || undefined })
  const analytics = useFinancialAnalytics({
    company_id: companyId || undefined,
    date_from: dateFrom,
    date_to: dateTo,
    horizon_months: 12,
  })
  const { data: entries } = useFinancialEntries({ date_from: dateFrom, date_to: dateTo, company_id: companyId || undefined, limit: 50, offset: 0 })
  const { data: fixedCosts } = useFixedCosts({ date_from: dateFrom, date_to: dateTo })
  const { data: variableCosts } = useVariableCosts({ date_from: dateFrom, date_to: dateTo })
  const createFc = useCreateFixedCost()
  const updateFc = useUpdateFixedCost()
  const deleteFc = useDeleteFixedCost()
  const { data: companiesData } = useCompanies({ limit: 200 })
  const createVc = useCreateVariableCost()
  const updateVc = useUpdateVariableCost()
  const deleteVc = useDeleteVariableCost()
  const createFixedCostInterest = useCreateFixedCostInterest()
  const updateFixedCostInterest = useUpdateFixedCostInterest()
  const deleteFixedCostInterest = useDeleteFixedCostInterest()
  const { year: competenceYear, month: competenceMonth } = getCompetenceFromDate(dateTo)
  const { data: selectedFixedCostInterests } = useFixedCostInterests(
    selectedFixedCost?.id ?? null,
    { reference_year: competenceYear },
  )

  const allCompanyOptions = [
    { value: '', label: 'Nenhum (custo geral)' },
    ...(companiesData?.companies ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.type})` })),
  ]

  const companyFilterOptions = [
    { value: '', label: 'Todas as empresas' },
    ...(companiesData?.companies ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.type})` })),
  ]

  const analyticsErrorMessage = useMemo(() => {
    if (!analytics.error) return ''
    return getApiErrorMessage(analytics.error, 'Erro ao carregar analytics')
  }, [analytics.error])

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

  const handleFixedCostInterestSubmit = async (dto: CreateFixedCostInterestDto | UpdateFixedCostInterestDto) => {
    if (!selectedFixedCost) return
    setInterestError('')
    try {
      if (editingInterest) {
        await updateFixedCostInterest.mutateAsync({
          fixedCostId: selectedFixedCost.id,
          interestId: editingInterest.id,
          dto,
        })
      } else {
        await createFixedCostInterest.mutateAsync({ fixedCostId: selectedFixedCost.id, dto })
      }
      setEditingInterest(undefined)
    } catch (error: unknown) {
      setInterestError(getApiErrorMessage(error, 'Erro ao salvar juros'))
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <FinancialFiltersBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        companyId={companyId}
        companyOptions={companyFilterOptions}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onCompanyChange={setCompanyId}
      />

      <FinancialTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        id="financial-panel-entries"
        role="tabpanel"
        aria-labelledby="financial-tab-entries"
        hidden={activeTab !== 'entries'}
        className="flex flex-col gap-8"
      >
        <FinancialReportSummaryCards report={report} loading={reportLoading} />
        <FinancialMonthlyTable entries={report?.entries_by_month} />
        <FinancialEntriesTable entries={entries} />
      </div>

      <div
        id="financial-panel-fixed-costs"
        role="tabpanel"
        aria-labelledby="financial-tab-fixed-costs"
        hidden={activeTab !== 'fixed-costs'}
        className="flex flex-col gap-8"
      >
        <FixedCostsSummaryCards
          fixedCosts={fixedCosts}
          competenceYear={competenceYear}
          competenceMonth={competenceMonth}
        />
        <FixedCostsSection
          fixedCosts={fixedCosts}
          competenceYear={competenceYear}
          competenceMonth={competenceMonth}
          onOpenCreate={() => setFcModalOpen(true)}
          onOpenInterestModal={(cost) => {
            setSelectedFixedCost(cost)
            setEditingInterest(undefined)
            setInterestError('')
            setFixedCostInterestModalOpen(true)
          }}
          onEdit={(cost) => {
            setEditingFc(cost)
            setFcModalOpen(true)
          }}
          onDelete={(id) => {
            const selectedFixedCostToDelete = fixedCosts?.find((item) => item.id === id)
            if (!selectedFixedCostToDelete) return
            setFixedCostToDelete(selectedFixedCostToDelete)
          }}
        />
      </div>

      <div
        id="financial-panel-variable-costs"
        role="tabpanel"
        aria-labelledby="financial-tab-variable-costs"
        hidden={activeTab !== 'variable-costs'}
        className="flex flex-col gap-8"
      >
        <VariableCostsSummaryCards variableCosts={variableCosts} />
        <VariableCostsSection
          variableCosts={variableCosts}
          onOpenCreate={() => setVcModalOpen(true)}
          onEdit={(cost) => {
            setEditingVc(cost)
            setVcModalOpen(true)
          }}
          onDelete={(id) => {
            const selectedVariableCost = variableCosts?.find((item) => item.id === id)
            if (!selectedVariableCost) return
            setVariableCostToDelete(selectedVariableCost)
          }}
        />
      </div>

      <div
        id="financial-panel-graphs"
        role="tabpanel"
        aria-labelledby="financial-tab-graphs"
        hidden={activeTab !== 'graphs'}
        className="flex flex-col gap-4"
      >
        {analytics.isLoading && (
          <div className="py-8 text-center text-gray-500" aria-live="polite">Carregando gráficos…</div>
        )}

        {analyticsErrorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" aria-live="assertive">{analyticsErrorMessage}</div>
        )}

        {analytics.data && analytics.data.historical_by_month.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 text-center text-gray-500">
            Sem dados para o período selecionado.
          </div>
        )}

        {analytics.data && analytics.data.historical_by_month.length > 0 && (
          <FinancialGraphs analytics={analytics.data} formatMonthLabel={formatMonthLabel} />
        )}
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
          companyOptions={allCompanyOptions}
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
          companyOptions={allCompanyOptions}
        />
      </Modal>

      <Modal
        open={fixedCostInterestModalOpen}
        title={selectedFixedCost ? `Juros de ${selectedFixedCost.name}` : 'Juros por competência'}
        onClose={() => {
          setFixedCostInterestModalOpen(false)
          setSelectedFixedCost(undefined)
          setEditingInterest(undefined)
          setInterestError('')
        }}
      >
        {selectedFixedCost && (
          <div className="flex flex-col gap-4">
            {interestError && <p className="text-sm text-red-600" aria-live="assertive">{interestError}</p>}
            <FixedCostInterestForm
              initial={editingInterest}
              referenceYear={competenceYear}
              referenceMonth={competenceMonth}
              onSubmit={handleFixedCostInterestSubmit}
              loading={createFixedCostInterest.isPending || updateFixedCostInterest.isPending}
            />
            <FixedCostInterestSection
              competenceYear={competenceYear}
              interests={selectedFixedCostInterests}
              onEdit={setEditingInterest}
              onDelete={async (interest) => {
                setInterestToDelete(interest)
              }}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(variableCostToDelete)}
        title="Excluir custo variável"
        description={variableCostToDelete ? `Tem certeza que deseja excluir "${variableCostToDelete.name}"?` : undefined}
        confirmLabel="Excluir"
        onCancel={() => setVariableCostToDelete(undefined)}
        onConfirm={() => {
          if (!variableCostToDelete) return
          void deleteVc.mutateAsync(variableCostToDelete.id)
          setVariableCostToDelete(undefined)
        }}
        loading={deleteVc.isPending}
      />

      <ConfirmDialog
        open={Boolean(fixedCostToDelete)}
        title="Excluir custo fixo"
        description={fixedCostToDelete ? `Tem certeza que deseja excluir "${fixedCostToDelete.name}"?` : undefined}
        confirmLabel="Excluir"
        onCancel={() => setFixedCostToDelete(undefined)}
        onConfirm={() => {
          if (!fixedCostToDelete) return
          void deleteFc.mutateAsync(fixedCostToDelete.id)
          setFixedCostToDelete(undefined)
        }}
        loading={deleteFc.isPending}
      />

      <ConfirmDialog
        open={Boolean(interestToDelete)}
        title="Remover juros"
        description={interestToDelete ? `Tem certeza que deseja remover os juros de ${String(interestToDelete.reference_month).padStart(2, '0')}/${interestToDelete.reference_year}?` : undefined}
        confirmLabel="Remover"
        onCancel={() => setInterestToDelete(undefined)}
        onConfirm={async () => {
          if (!selectedFixedCost || !interestToDelete) return
          try {
            await deleteFixedCostInterest.mutateAsync({ fixedCostId: selectedFixedCost.id, interestId: interestToDelete.id })
            setInterestToDelete(undefined)
          } catch (error: unknown) {
            setInterestError(getApiErrorMessage(error, 'Erro ao remover juros'))
          }
        }}
        loading={deleteFixedCostInterest.isPending}
      />
    </div>
  )
}
