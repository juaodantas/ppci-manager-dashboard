import type { VariableCost } from '@manager/domain'
import type {
  IVariableCostRepository,
  CreateVariableCostDto,
  UpdateVariableCostDto,
} from '../../../domain/repositories/variable-cost.repository'

export class GetVariableCostsUseCase {
  constructor(private readonly repo: IVariableCostRepository) {}
  execute(params?: { date_from?: string; date_to?: string }): Promise<VariableCost[]> {
    return this.repo.findAll(params)
  }
}

export class CreateVariableCostUseCase {
  constructor(private readonly repo: IVariableCostRepository) {}
  execute(data: CreateVariableCostDto): Promise<VariableCost> {
    return this.repo.create(data)
  }
}

export class UpdateVariableCostUseCase {
  constructor(private readonly repo: IVariableCostRepository) {}
  execute(id: string, data: UpdateVariableCostDto): Promise<VariableCost> {
    return this.repo.update(id, data)
  }
}

export class DeleteVariableCostUseCase {
  constructor(private readonly repo: IVariableCostRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}
