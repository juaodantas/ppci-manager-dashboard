'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type {
  CreateFixedCostDto,
  UpdateFixedCostDto,
  CreateFixedCostInterestDto,
  UpdateFixedCostInterestDto,
} from '../../domain/repositories/fixed-cost.repository'

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixed-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}

export function useUpdateFixedCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFixedCostDto }) =>
      container.fixedCosts.update.execute(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixed-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}

export function useDeleteFixedCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.fixedCosts.delete.execute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixed-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}

export function useFixedCostInterests(fixedCostId: string | null, params?: { reference_year?: number }) {
  return useQuery({
    queryKey: ['fixed-cost-interests', fixedCostId, params],
    queryFn: () => container.fixedCosts.listInterests.execute(fixedCostId ?? '', params),
    enabled: Boolean(fixedCostId),
  })
}

export function useCreateFixedCostInterest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fixedCostId, dto }: { fixedCostId: string; dto: CreateFixedCostInterestDto }) =>
      container.fixedCosts.createInterest.execute(fixedCostId, dto),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['fixed-cost-interests', variables.fixedCostId] })
      qc.invalidateQueries({ queryKey: ['fixed-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}

export function useUpdateFixedCostInterest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fixedCostId, interestId, dto }: { fixedCostId: string; interestId: string; dto: UpdateFixedCostInterestDto }) =>
      container.fixedCosts.updateInterest.execute(fixedCostId, interestId, dto),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['fixed-cost-interests', variables.fixedCostId] })
      qc.invalidateQueries({ queryKey: ['fixed-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}

export function useDeleteFixedCostInterest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fixedCostId, interestId }: { fixedCostId: string; interestId: string }) =>
      container.fixedCosts.deleteInterest.execute(fixedCostId, interestId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['fixed-cost-interests', variables.fixedCostId] })
      qc.invalidateQueries({ queryKey: ['fixed-costs'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}
