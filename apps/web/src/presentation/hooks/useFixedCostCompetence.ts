'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type { FixedCostMonthResolution, FixedCostMonthlyLine, UpdateFixedCostMonthlyEntryDto } from '../../domain/repositories/fixed-cost-month.repository'

type FixedCostMonthQueryParams = {
  reference_year: number
  reference_month: number
  company_id?: string
}

export function buildFixedCostMonthQueryKey(params: FixedCostMonthQueryParams) {
  return ['fixed-cost-month', params.reference_year, params.reference_month, params.company_id ?? 'all'] as const
}

function currentCompetence() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function shiftCompetence(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function useFixedCostCompetence(companyId?: string) {
  const initial = useMemo(currentCompetence, [])
  const [competence, setCompetence] = useState(initial)
  const queryClient = useQueryClient()
  const queryParams = useMemo(() => ({
    reference_year: competence.year,
    reference_month: competence.month,
    company_id: companyId || undefined,
  }), [companyId, competence.month, competence.year])
  const queryKey = buildFixedCostMonthQueryKey(queryParams)

  const syncAfterMutation = (resolution: FixedCostMonthResolution) => {
    queryClient.setQueryData(queryKey, resolution)
    queryClient.invalidateQueries({ queryKey: ['fixed-cost-month'] })
    queryClient.invalidateQueries({ queryKey: ['financial'] })
  }

  const query = useQuery({
    queryKey,
    queryFn: () => container.fixedCostMonth.get.execute(queryParams),
  })

  const updateEntry = useMutation({
    mutationFn: ({ line, data }: { line: FixedCostMonthlyLine; data: UpdateFixedCostMonthlyEntryDto }) =>
      container.fixedCostMonth.updateEntry.execute({
        fixedCostId: line.fixed_cost_id,
        referenceYear: competence.year,
        referenceMonth: competence.month,
        data,
      }),
    onSuccess: syncAfterMutation,
  })

  const closeMonth = useMutation({
    mutationFn: () => container.fixedCostMonth.close.execute({
      referenceYear: competence.year,
      referenceMonth: competence.month,
      companyId: companyId || undefined,
    }),
    onSuccess: syncAfterMutation,
  })

  return {
    competence,
    previousCompetence: shiftCompetence(competence.year, competence.month, -1),
    nextCompetence: shiftCompetence(competence.year, competence.month, 1),
    goToPreviousMonth: () => setCompetence((current) => shiftCompetence(current.year, current.month, -1)),
    goToNextMonth: () => setCompetence((current) => shiftCompetence(current.year, current.month, 1)),
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateEntry,
    closeMonth,
  }
}
