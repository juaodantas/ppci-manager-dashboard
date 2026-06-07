import type {
  FixedCostMonthResolution,
  IFixedCostMonthRepository,
  UpdateFixedCostMonthlyEntryDto,
} from '../../../domain/repositories/fixed-cost-month.repository'

export class GetFixedCostMonthUseCase {
  constructor(private readonly repo: IFixedCostMonthRepository) {}

  execute(params: { reference_year: number; reference_month: number; company_id?: string }): Promise<FixedCostMonthResolution> {
    return this.repo.get(params)
  }
}

export class UpdateFixedCostMonthEntryUseCase {
  constructor(private readonly repo: IFixedCostMonthRepository) {}

  execute(params: {
    fixedCostId: string
    referenceYear: number
    referenceMonth: number
    data: UpdateFixedCostMonthlyEntryDto
  }): Promise<FixedCostMonthResolution> {
    return this.repo.updateEntry(params)
  }
}

export class CloseFixedCostMonthUseCase {
  constructor(private readonly repo: IFixedCostMonthRepository) {}

  execute(params: { referenceYear: number; referenceMonth: number; companyId?: string }): Promise<FixedCostMonthResolution> {
    return this.repo.close(params)
  }
}
