'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type { CreateCustomerDto, UpdateCustomerDto } from '../../domain/repositories/customer.repository'

export function useCustomers(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => container.customers.list.execute({ limit: params?.limit ?? 20, offset: params?.offset ?? 0 }),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => container.customers.get.execute(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCustomerDto) => container.customers.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDto }) =>
      container.customers.update.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.customers.delete.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
