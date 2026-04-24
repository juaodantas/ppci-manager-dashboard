import type { Project, ProjectService } from '@manager/domain'

export interface CreateProjectDto {
  customer_id: string
  company_id: string
  quote_id?: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  total_value?: number
}

export interface UpdateProjectDto {
  name?: string
  description?: string
  status?: 'planning' | 'in_progress' | 'finished' | 'finished_pending_payment' | 'canceled'
  company_id?: string
  start_date?: string
  end_date?: string
  total_value?: number
}

export interface AddProjectServiceDto {
  service_id: string
  quantity: number
  unit_price: number
  description?: string
  service_type?: 'service' | 'tax_deduction'
}

export interface UpdateProjectServiceDto {
  quantity?: number
  unit_price?: number
  description?: string
  tax_status?: 'not_issued' | 'issued'
  tax_issued_at?: string
  tax_variable_cost_id?: string
}

export interface AddProjectTaxDto {
  amount: number
  description?: string
}

export interface IssueProjectTaxDto {
  issue_date: string
}

export interface IProjectRepository {
  findAll(params: {
    limit: number
    offset: number
  status?: string
  customer_id?: string
  company_id?: string
  search?: string
  }): Promise<{ projects: Project[]; total: number }>
  findById(id: string): Promise<Project>
  create(data: CreateProjectDto): Promise<Project>
  update(id: string, data: UpdateProjectDto): Promise<Project>
  addService(projectId: string, data: AddProjectServiceDto): Promise<ProjectService>
  updateService(id: string, data: UpdateProjectServiceDto): Promise<ProjectService>
  removeService(id: string): Promise<void>
  addTax(projectId: string, data: AddProjectTaxDto): Promise<ProjectService>
  issueTax(serviceId: string, projectId: string, data: IssueProjectTaxDto): Promise<ProjectService>
  delete(id: string): Promise<void>
}
