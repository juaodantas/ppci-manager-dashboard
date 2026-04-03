import { ServiceRepository } from '../../repositories/service.repository.ts'
import { notFound } from '../../errors.ts'

export async function deleteService(id: string): Promise<void> {
  const service = await ServiceRepository.findById(id)
  if (!service) throw notFound('Service', id)
  await ServiceRepository.delete(id)
}
