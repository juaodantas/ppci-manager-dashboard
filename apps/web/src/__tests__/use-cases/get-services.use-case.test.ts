import { describe, it, expect, vi } from 'vitest'
import { GetServicesUseCase } from '../../application/use-cases/service/get-services.use-case'
import type { IServiceRepository } from '../../domain/repositories/service.repository'
import type { Service, ServiceStats } from '../../domain/entities/service.entity'

const mockPaginatedResult = {
  servicos: [] as Service[],
  total: 0,
  limit: 20,
  offset: 0,
}

function makeServiceRepo(): IServiceRepository {
  return {
    findAll: vi.fn().mockResolvedValue(mockPaginatedResult),
    findById: vi.fn().mockResolvedValue({} as Service),
    getStats: vi.fn().mockResolvedValue({ total: 5, em_andamento: 2, concluidos: 1, pausados: 1, cancelados: 1 } as ServiceStats),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}

describe('GetServicesUseCase', () => {
  it('getAll() delegates to serviceRepo.findAll with no params', async () => {
    const repo = makeServiceRepo()
    const useCase = new GetServicesUseCase(repo)

    const result = await useCase.getAll()

    expect(repo.findAll).toHaveBeenCalledWith(undefined)
    expect(result).toBe(mockPaginatedResult)
  })

  it('getAll() passes status filter to serviceRepo.findAll', async () => {
    const repo = makeServiceRepo()
    const useCase = new GetServicesUseCase(repo)

    await useCase.getAll({ status: 'EM_ANDAMENTO' })

    expect(repo.findAll).toHaveBeenCalledWith({ status: 'EM_ANDAMENTO' })
  })

  it('getAll() passes pagination params to serviceRepo.findAll', async () => {
    const repo = makeServiceRepo()
    const useCase = new GetServicesUseCase(repo)

    await useCase.getAll({ limit: 10, offset: 20 })

    expect(repo.findAll).toHaveBeenCalledWith({ limit: 10, offset: 20 })
  })

  it('getById() delegates to serviceRepo.findById', async () => {
    const repo = makeServiceRepo()
    const useCase = new GetServicesUseCase(repo)

    await useCase.getById('svc-1')

    expect(repo.findById).toHaveBeenCalledWith('svc-1')
  })

  it('getStats() delegates to serviceRepo.getStats', async () => {
    const repo = makeServiceRepo()
    const useCase = new GetServicesUseCase(repo)

    const stats = await useCase.getStats()

    expect(repo.getStats).toHaveBeenCalled()
    expect(stats.total).toBe(5)
  })
})
