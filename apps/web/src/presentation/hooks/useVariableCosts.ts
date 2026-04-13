'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type { CreateVariableCostDto, UpdateVariableCostDto } from '../../domain/repositories/variable-cost.repository'

export function useVariableCosts(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['variable-costs', params],
    queryFn: () => container.variableCosts.list.execute(params),
  })
}

export function useCreateVariableCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVariableCostDto) => container.variableCosts.create.execute(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variable-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}

export function useUpdateVariableCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVariableCostDto }) =>
      container.variableCosts.update.execute(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variable-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}

export function useDeleteVariableCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.variableCosts.delete.execute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variable-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}
