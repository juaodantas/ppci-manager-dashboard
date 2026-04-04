import type { AxiosInstance } from 'axios'
import type { Project, ProjectService } from '@manager/domain'
import type {
  IProjectRepository,
  CreateProjectDto,
  UpdateProjectDto,
  AddProjectServiceDto,
  UpdateProjectServiceDto,
} from '../../domain/repositories/project.repository'

export class ProjectHttpRepository implements IProjectRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(params: {
    limit: number
    offset: number
    status?: string
    customer_id?: string
  }): Promise<{ projects: Project[]; total: number }> {
    const { data } = await this.http.get<{ projects: Project[]; total: number }>('/projects', { params })
    return data
  }

  async findById(id: string): Promise<Project> {
    const { data } = await this.http.get<Project>(`/projects/${id}`)
    return data
  }

  async create(body: CreateProjectDto): Promise<Project> {
    const { data } = await this.http.post<Project>('/projects', body)
    return data
  }

  async update(id: string, body: UpdateProjectDto): Promise<Project> {
    const { data } = await this.http.put<Project>(`/projects/${id}`, body)
    return data
  }

  async addService(projectId: string, body: AddProjectServiceDto): Promise<ProjectService> {
    const { data } = await this.http.post<ProjectService>(`/projects/${projectId}/services`, body)
    return data
  }

  async updateService(id: string, body: UpdateProjectServiceDto): Promise<ProjectService> {
    const { data } = await this.http.put<ProjectService>(`/project-services/${id}`, body)
    return data
  }

  async removeService(id: string): Promise<void> {
    await this.http.delete(`/project-services/${id}`)
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/projects/${id}`)
  }
}
