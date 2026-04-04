import type { Project, ProjectService } from '@manager/domain'
import type {
  IProjectRepository,
  CreateProjectDto,
  UpdateProjectDto,
  AddProjectServiceDto,
  UpdateProjectServiceDto,
} from '../../../domain/repositories/project.repository'

export class GetProjectsUseCase {
  constructor(private readonly repo: IProjectRepository) {}
  execute(params: {
    limit: number
    offset: number
    status?: string
    customer_id?: string
  }): Promise<{ projects: Project[]; total: number }> {
    return this.repo.findAll(params)
  }
}

export class GetProjectUseCase {
  constructor(private readonly repo: IProjectRepository) {}
  execute(id: string): Promise<Project> {
    return this.repo.findById(id)
  }
}

export class CreateProjectUseCase {
  constructor(private readonly repo: IProjectRepository) {}
  execute(data: CreateProjectDto): Promise<Project> {
    return this.repo.create(data)
  }
}

export class UpdateProjectUseCase {
  constructor(private readonly repo: IProjectRepository) {}
  execute(id: string, data: UpdateProjectDto): Promise<Project> {
    return this.repo.update(id, data)
  }
}

export class AddProjectServiceUseCase {
  constructor(private readonly repo: IProjectRepository) {}
  execute(projectId: string, data: AddProjectServiceDto): Promise<ProjectService> {
    return this.repo.addService(projectId, data)
  }
}

export class UpdateProjectServiceUseCase {
  constructor(private readonly repo: IProjectRepository) {}
  execute(id: string, data: UpdateProjectServiceDto): Promise<ProjectService> {
    return this.repo.updateService(id, data)
  }
}

export class RemoveProjectServiceUseCase {
  constructor(private readonly repo: IProjectRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.removeService(id)
  }
}

export class DeleteProjectUseCase {
  constructor(private readonly repo: IProjectRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}
