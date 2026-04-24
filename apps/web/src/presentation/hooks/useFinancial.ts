'use client'

import { useQuery } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'

export function useFinancialEntries(params?: {
  type?: string
  date_from?: string
  date_to?: string
  company_id?: string
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
        company_id: params?.company_id,
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      }),
  })
}

export function useFinancialReport(params: { date_from: string; date_to: string; company_id?: string }) {
  return useQuery({
    queryKey: ['financial', 'report', params],
    queryFn: () => container.financial.report.execute({ date_from: params.date_from, date_to: params.date_to, company_id: params.company_id }),
    enabled: !!params.date_from && !!params.date_to,
  })
}
