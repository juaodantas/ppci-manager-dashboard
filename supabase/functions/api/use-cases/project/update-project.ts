import { Project } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { notFound, HttpError } from '../../errors.ts'
import { UpdateProjectDto } from '../../validation/schemas.ts'

export async function updateProject(id: string, dto: UpdateProjectDto): Promise<Project> {
  const existing = await ProjectRepository.findById(id)
  if (!existing) throw notFound('Project', id)

  // RN01: cannot edit a finished project
  if (existing.status === 'finished') {
    throw new HttpError(422, 'Cannot update a finished project')
  }

  // RN02: cannot finish a project with pending payments
  if (dto.status === 'finished') {
    const hasPending = await ProjectRepository.hasPendingPayments(id)
    if (hasPending) {
      throw new HttpError(422, 'Cannot finish a project with pending payments')
    }
  }

  const updated = await ProjectRepository.update(id, {
    name: dto.name,
    description: dto.description,
    status: dto.status,
    start_date: dto.start_date,
    end_date: dto.end_date,
    total_value: dto.total_value,
  })

  return updated!
}
