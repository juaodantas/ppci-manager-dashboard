import { ProjectService } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { badRequest, notFound } from '../../errors.ts'
import { AddProjectTaxDto } from '../../validation/schemas.ts'

export async function addProjectTax(projectId: string, dto: AddProjectTaxDto): Promise<ProjectService> {
  const project = await ProjectRepository.findById(projectId)
  if (!project) throw notFound('Project', projectId)

  const internalServiceId = await ProjectRepository.findInternalTaxServiceId()
  if (!internalServiceId) {
    throw badRequest('Internal tax service not configured')
  }

  return ProjectRepository.addService({
    project_id: projectId,
    service_id: internalServiceId,
    quantity: 1,
    unit_price: dto.amount,
    description: dto.description,
    service_type: 'tax_deduction',
    tax_status: 'not_issued',
  })
}
