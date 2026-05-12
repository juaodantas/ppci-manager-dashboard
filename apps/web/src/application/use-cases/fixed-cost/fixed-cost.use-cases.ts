import type { FixedCost } from '@manager/domain'
import type {
  IFixedCostRepository,
  FixedCostInterest,
  CreateFixedCostInterestDto,
  UpdateFixedCostInterestDto,
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

export class GetFixedCostInterestsUseCase {
  constructor(private readonly repo: IFixedCostRepository) {}
  execute(fixedCostId: string, params?: { reference_year?: number }): Promise<FixedCostInterest[]> {
    return this.repo.listInterests(fixedCostId, params)
  }
}

export class CreateFixedCostInterestUseCase {
  constructor(private readonly repo: IFixedCostRepository) {}
  execute(fixedCostId: string, data: CreateFixedCostInterestDto): Promise<FixedCostInterest> {
    return this.repo.createInterest(fixedCostId, data)
  }
}

export class UpdateFixedCostInterestUseCase {
  constructor(private readonly repo: IFixedCostRepository) {}
  execute(fixedCostId: string, interestId: string, data: UpdateFixedCostInterestDto): Promise<FixedCostInterest> {
    return this.repo.updateInterest(fixedCostId, interestId, data)
  }
}

export class DeleteFixedCostInterestUseCase {
  constructor(private readonly repo: IFixedCostRepository) {}
  execute(fixedCostId: string, interestId: string): Promise<void> {
    return this.repo.deleteInterest(fixedCostId, interestId)
  }
}
