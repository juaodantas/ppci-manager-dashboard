import { UserRepository } from '../../repositories/user.repository.ts'
import { notFound } from '../../errors.ts'

export async function deleteUser(id: string): Promise<void> {
  const user = await UserRepository.findById(id)
  if (!user) throw notFound('User', id)
  await UserRepository.delete(id)
}
