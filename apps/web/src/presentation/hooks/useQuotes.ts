'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Quote } from '@manager/domain'
import { container } from '../../infrastructure/di/container'
import type { CreateQuoteDto, UpdateQuoteDto, ApproveQuoteDto } from '../../domain/repositories/quote.repository'

type QuotesListResult = {
  quotes: Quote[]
  total: number
}

export function useQuotes(params?: { limit?: number; offset?: number; status?: string; customer_id?: string }) {
  return useQuery<QuotesListResult, Error>({
    queryKey: ['quotes', params],
    queryFn: () =>
      container.quotes.list.execute({
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        status: params?.status,
        customer_id: params?.customer_id,
      }),
  }) as UseQueryResult<QuotesListResult, Error>
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => container.quotes.get.execute(id),
    enabled: !!id,
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateQuoteDto) => container.quotes.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateQuoteDto }) =>
      container.quotes.update.execute(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      qc.invalidateQueries({ queryKey: ['quotes', id] })
    },
  })
}

export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.quotes.delete.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

export function useApproveQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ApproveQuoteDto }) =>
      container.quotes.approve.execute(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
