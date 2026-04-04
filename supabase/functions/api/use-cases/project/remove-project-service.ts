import { ProjectRepository } from '../../repositories/project.repository.ts'

export async function removeProjectService(id: string): Promise<void> {
  await ProjectRepository.removeService(id)
}
