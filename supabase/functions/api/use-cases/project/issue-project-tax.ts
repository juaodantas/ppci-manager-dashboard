import { ProjectService } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { VariableCostRepository } from '../../repositories/variable-cost.repository.ts'
import { badRequest, conflict, notFound } from '../../errors.ts'
import { IssueProjectTaxDto } from '../../validation/schemas.ts'

export async function issueProjectTax(
  projectId: string,
  serviceId: string,
  dto: IssueProjectTaxDto,
): Promise<ProjectService> {
  const project = await ProjectRepository.findById(projectId)
  if (!project) throw notFound('Project', projectId)

  const service = await ProjectRepository.findServiceById(serviceId)
  if (!service) throw notFound('ProjectService', serviceId)

  if (service.project_id !== projectId) {
    throw badRequest('ProjectService does not belong to project')
  }

  if (service.service_type !== 'tax_deduction') {
    throw badRequest('Only tax deduction services can be issued')
  }

  if (service.tax_status === 'issued' || service.tax_variable_cost_id) {
    throw conflict('Tax already issued')
  }

  if (service.total_price <= 0) {
    throw badRequest('Tax amount must be greater than zero')
  }

  const variableCost = await VariableCostRepository.save({
    name: `imposto - ${project.name} - ${dto.issue_date}`,
    amount: service.total_price,
    date: dto.issue_date,
    category: 'impostos',
    description: `Imposto interno do projeto ${project.name}`,
  })

  const updated = await ProjectRepository.updateService(serviceId, {
    tax_status: 'issued',
    tax_issued_at: dto.issue_date,
    tax_variable_cost_id: variableCost.id,
  })

  if (!updated) throw notFound('ProjectService', serviceId)
  return updated
}
