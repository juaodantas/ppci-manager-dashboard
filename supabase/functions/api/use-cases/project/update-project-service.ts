import { ProjectService } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { notFound, HttpError } from '../../errors.ts'
import { UpdateProjectServiceDto } from '../../validation/schemas.ts'

export async function updateProjectService(
  id: string,
  dto: UpdateProjectServiceDto,
): Promise<ProjectService> {
  const existing = await ProjectRepository.findServiceById(id)
  if (!existing) throw notFound('ProjectService', id)

  const project = await ProjectRepository.findById(existing.project_id)
  if (!project) throw notFound('Project', existing.project_id)

  if (project.status === 'finished') {
    throw new HttpError(422, 'Cannot update services for a finished project')
  }

  if (dto.service_id !== undefined) {
    throw new HttpError(422, 'Cannot change service_id for a project service')
  }

  const serviceType = existing.service_type ?? 'service'
  const isTax = serviceType === 'tax_deduction'
  const hasTaxFields =
    dto.tax_status !== undefined || dto.tax_issued_at !== undefined || dto.tax_variable_cost_id !== undefined

  if (isTax) {
    if (existing.tax_status === 'issued' || existing.tax_variable_cost_id) {
      throw new HttpError(422, 'Cannot update an issued tax')
    }
    if (hasTaxFields) {
      throw new HttpError(422, 'Cannot update tax issuance fields')
    }
  } else if (hasTaxFields) {
    throw new HttpError(422, 'Cannot update tax fields for a regular service')
  }

  const updated = await ProjectRepository.updateService(id, {
    quantity: dto.quantity,
    unit_price: dto.unit_price,
    description: dto.description,
  })
  if (!updated) throw notFound('ProjectService', id)
  return updated
}
