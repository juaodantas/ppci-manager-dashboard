import { Project } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { notFound, HttpError, badRequest } from '../../errors.ts'
import { UpdateProjectDto } from '../../validation/schemas.ts'
import sql from '../../db.ts'

export async function updateProject(id: string, dto: UpdateProjectDto): Promise<Project> {
  const existing = await ProjectRepository.findById(id)
  if (!existing) throw notFound('Project', id)

  // RN01: cannot edit a finished project
  if (existing.status === 'finished') {
    throw new HttpError(422, 'Cannot update a finished project')
  }

  if (dto.company_id !== undefined) {
    const companyRows = await sql`SELECT type FROM companies WHERE id = ${dto.company_id}`
    if (companyRows.length === 0 || companyRows[0].type !== 'internal') {
      throw badRequest('company_id must reference a company of type internal')
    }
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
    company_id: dto.company_id,
  })

  return updated!
}
