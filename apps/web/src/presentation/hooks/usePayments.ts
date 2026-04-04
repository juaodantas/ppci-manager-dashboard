'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type { CreatePaymentDto } from '../../domain/repositories/payment.repository'

export function usePayments(params?: { project_id?: string; status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () =>
      container.payments.list.execute({
        project_id: params?.project_id,
        status: params?.status,
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      }),
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePaymentDto) => container.payments.create.execute(dto),
    onSuccess: (_data, dto) => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['projects', dto.project_id] })
    },
  })
}

export function usePayPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paid_date }: { id: string; paid_date: string }) =>
      container.payments.pay.execute(id, paid_date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}
