import { Project } from '../../../_shared/domain/entities/project.entity.ts'
import { ProjectRepository } from '../../repositories/project.repository.ts'
import { CreateProjectDto } from '../../validation/schemas.ts'

export async function createProject(dto: CreateProjectDto): Promise<Project> {
  return ProjectRepository.save({
    customer_id: dto.customer_id,
    quote_id: dto.quote_id,
    name: dto.name,
    description: dto.description,
    start_date: dto.start_date,
    end_date: dto.end_date,
    total_value: dto.total_value,
  })
}
