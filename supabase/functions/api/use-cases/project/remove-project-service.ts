import { ProjectRepository } from '../../repositories/project.repository.ts'
import { notFound, HttpError } from '../../errors.ts'

export async function removeProjectService(id: string): Promise<void> {
  const existing = await ProjectRepository.findServiceById(id)
  if (!existing) throw notFound('ProjectService', id)

  const project = await ProjectRepository.findById(existing.project_id)
  if (!project) throw notFound('Project', existing.project_id)

  if (project.status === 'finished') {
    throw new HttpError(422, 'Cannot remove services from a finished project')
  }

  const serviceType = existing.service_type ?? 'service'
  if (serviceType === 'tax_deduction') {
    if (existing.tax_status === 'issued' || existing.tax_variable_cost_id) {
      throw new HttpError(422, 'Cannot remove an issued tax')
    }
  }

  await ProjectRepository.removeService(id)
}
