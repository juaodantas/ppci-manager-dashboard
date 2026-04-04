import type { Project, ProjectService } from '@manager/domain'

export interface CreateProjectDto {
  customer_id: string
  quote_id?: string
  name: string
  description?: string
  start_date?: string
  total_value?: number
}

export interface UpdateProjectDto {
  name?: string
  description?: string
  status?: 'planning' | 'in_progress' | 'finished' | 'canceled'
  start_date?: string
  end_date?: string
  total_value?: number
}

export interface AddProjectServiceDto {
  service_id: string
  quantity: number
  unit_price: number
  description?: string
}

export interface UpdateProjectServiceDto {
  quantity?: number
  unit_price?: number
  description?: string
}

export interface IProjectRepository {
  findAll(params: {
    limit: number
    offset: number
    status?: string
    customer_id?: string
  }): Promise<{ projects: Project[]; total: number }>
  findById(id: string): Promise<Project>
  create(data: CreateProjectDto): Promise<Project>
  update(id: string, data: UpdateProjectDto): Promise<Project>
  addService(projectId: string, data: AddProjectServiceDto): Promise<ProjectService>
  updateService(id: string, data: UpdateProjectServiceDto): Promise<ProjectService>
  removeService(id: string): Promise<void>
}
