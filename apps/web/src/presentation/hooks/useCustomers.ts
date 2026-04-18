'use client'

import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Customer } from '@manager/domain'
import { container } from '../../infrastructure/di/container'
import type { CreateCustomerDto, UpdateCustomerDto } from '../../domain/repositories/customer.repository'

type CustomersListResult = {
  customers: Customer[]
  total: number
}

export function useCustomers(params?: { limit?: number; offset?: number; search?: string }) {
  return useQuery<CustomersListResult, Error>({
    queryKey: ['customers', params],
    queryFn: () =>
      container.customers.list.execute({
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        search: params?.search,
      }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  }) as UseQueryResult<CustomersListResult, Error>
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
