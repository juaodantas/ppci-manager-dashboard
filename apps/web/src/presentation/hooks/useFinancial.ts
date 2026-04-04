'use client'

import { useQuery } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'

export function useFinancialEntries(params?: {
  type?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['financial', 'entries', params],
    queryFn: () =>
      container.financial.entries.execute({
        type: params?.type,
        date_from: params?.date_from,
        date_to: params?.date_to,
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      }),
  })
}

export function useFinancialReport(date_from: string, date_to: string) {
  return useQuery({
    queryKey: ['financial', 'report', date_from, date_to],
    queryFn: () => container.financial.report.execute({ date_from, date_to }),
    enabled: !!date_from && !!date_to,
  })
}
