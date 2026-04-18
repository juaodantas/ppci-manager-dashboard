import { ProjectService } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { notFound } from '../../errors.ts'
import { UpdateProjectServiceDto } from '../../validation/schemas.ts'

export async function updateProjectService(
  id: string,
  dto: UpdateProjectServiceDto,
): Promise<ProjectService> {
  const updated = await ProjectRepository.updateService(id, {
    quantity: dto.quantity,
    unit_price: dto.unit_price,
    description: dto.description,
    tax_status: dto.tax_status,
    tax_issued_at: dto.tax_issued_at,
    tax_variable_cost_id: dto.tax_variable_cost_id,
  })
  if (!updated) throw notFound('ProjectService', id)
  return updated
}
