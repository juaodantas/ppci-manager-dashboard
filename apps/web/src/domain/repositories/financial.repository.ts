import type { FinancialEntry, FinancialReport } from '@manager/domain'

export interface IFinancialRepository {
  findEntries(params: {
  type?: string
  date_from?: string
  date_to?: string
  company_id?: string
  limit: number
    offset: number
  }): Promise<{ entries: FinancialEntry[]; total: number }>
  getReport(params: { date_from: string; date_to: string; company_id?: string }): Promise<FinancialReport>
}
