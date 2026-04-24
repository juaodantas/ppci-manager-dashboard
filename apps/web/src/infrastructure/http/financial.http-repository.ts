import type { AxiosInstance } from 'axios'
import type { FinancialEntry, FinancialReport } from '@manager/domain'
import type { IFinancialRepository } from '../../domain/repositories/financial.repository'

export class FinancialHttpRepository implements IFinancialRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findEntries(params: {
    type?: string
    date_from?: string
    date_to?: string
    company_id?: string
    limit: number
    offset: number
  }): Promise<{ entries: FinancialEntry[]; total: number }> {
    const { data } = await this.http.get<{ entries: FinancialEntry[]; total: number }>(
      '/financial/entries',
      { params },
    )
    return data
  }

  async getReport(params: { date_from: string; date_to: string; company_id?: string }): Promise<FinancialReport> {
    const { data } = await this.http.get<FinancialReport>('/financial/report', { params })
    return data
  }
}
