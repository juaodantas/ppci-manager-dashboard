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

export function useFinancialAnalytics(params: {
  company_id?: string
  date_from: string
  date_to: string
  horizon_months?: number
}) {
  return useQuery({
    queryKey: ['financial', 'analytics', params],
    queryFn: () => {
      if (!params.company_id) {
        throw new Error('company_id is required')
      }

      return container.financial.analytics.execute({
        company_id: params.company_id,
        date_from: params.date_from,
        date_to: params.date_to,
        horizon_months: params.horizon_months,
      })
    },
    enabled: !!params.company_id && !!params.date_from && !!params.date_to,
  })
}
