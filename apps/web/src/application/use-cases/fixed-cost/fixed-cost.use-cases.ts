import type { FixedCost } from '@manager/domain'
import type {
  IFixedCostRepository,
  CreateFixedCostDto,
  UpdateFixedCostDto,
} from '../../../domain/repositories/fixed-cost.repository'

export class GetFixedCostsUseCase {
  constructor(private readonly repo: IFixedCostRepository) {}
  execute(params?: { includeInactive?: boolean; date_from?: string; date_to?: string }): Promise<FixedCost[]> {
    return this.repo.findAll(params)
  }
}

export class CreateFixedCostUseCase {
  constructor(private readonly repo: IFixedCostRepository) {}
  execute(data: CreateFixedCostDto): Promise<FixedCost> {
    return this.repo.create(data)
  }
}

export class UpdateFixedCostUseCase {
  constructor(private readonly repo: IFixedCostRepository) {}
  execute(id: string, data: UpdateFixedCostDto): Promise<FixedCost> {
    return this.repo.update(id, data)
  }
}

export class DeleteFixedCostUseCase {
  constructor(private readonly repo: IFixedCostRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}
