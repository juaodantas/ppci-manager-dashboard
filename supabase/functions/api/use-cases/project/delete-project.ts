import { ProjectRepository } from '../../repositories/project.repository.ts'
import { notFound } from '../../errors.ts'

export async function deleteProject(id: string): Promise<void> {
  const project = await ProjectRepository.findById(id)
  if (!project) throw notFound('Project', id)
  await ProjectRepository.delete(id)
}
