import { ProjectService } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { notFound } from '../../errors.ts'
import { AddProjectServiceDto } from '../../validation/schemas.ts'

export async function addProjectService(
  projectId: string,
  dto: AddProjectServiceDto,
): Promise<ProjectService> {
  const project = await ProjectRepository.findById(projectId)
  if (!project) throw notFound('Project', projectId)

  return ProjectRepository.addService({
    project_id: projectId,
    service_id: dto.service_id,
    quantity: dto.quantity,
    unit_price: dto.unit_price,
    description: dto.description,
  })
}
