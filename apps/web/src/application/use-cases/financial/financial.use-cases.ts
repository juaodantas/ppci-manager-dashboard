import type { FinancialEntry, FinancialReport } from '@manager/domain'
import type { IFinancialRepository } from '../../../domain/repositories/financial.repository'

export class GetFinancialEntriesUseCase {
  constructor(private readonly repo: IFinancialRepository) {}
  execute(params: {
    type?: string
    date_from?: string
    date_to?: string
    limit: number
    offset: number
  }): Promise<{ entries: FinancialEntry[]; total: number }> {
    return this.repo.findEntries(params)
  }
}

export class GetFinancialReportUseCase {
  constructor(private readonly repo: IFinancialRepository) {}
  execute(params: { date_from: string; date_to: string }): Promise<FinancialReport> {
    return this.repo.getReport(params)
  }
}
