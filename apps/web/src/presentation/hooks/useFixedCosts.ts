'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type { CreateFixedCostDto, UpdateFixedCostDto } from '../../domain/repositories/fixed-cost.repository'

export function useFixedCosts(params?: { includeInactive?: boolean; date_from?: string; date_to?: string }) {
  const queryParams = {
    includeInactive: params?.includeInactive ?? false,
    date_from: params?.date_from,
    date_to: params?.date_to,
  }
  return useQuery({
    queryKey: ['fixed-costs', queryParams],
    queryFn: () => container.fixedCosts.list.execute(queryParams),
  })
}

export function useCreateFixedCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateFixedCostDto) => container.fixedCosts.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixed-costs'] }),
  })
}

export function useUpdateFixedCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFixedCostDto }) =>
      container.fixedCosts.update.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixed-costs'] }),
  })
}

export function useDeleteFixedCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.fixedCosts.delete.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixed-costs'] }),
  })
}
