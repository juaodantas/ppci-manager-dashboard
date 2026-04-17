import { Project } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllProjects(params: {
  limit: number
  offset: number
  status?: string
  customer_id?: string
  search?: string
}): Promise<{ projects: Project[]; total: number }> {
  return ProjectRepository.findAll(params)
}

export async function getProjectById(id: string): Promise<Project> {
  const project = await ProjectRepository.findById(id)
  if (!project) throw notFound('Project', id)
  return project
}
