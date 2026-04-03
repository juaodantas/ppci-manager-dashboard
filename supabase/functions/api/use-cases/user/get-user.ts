import { User } from '../../../_shared/domain/entities/user.entity.ts'
import { UserRepository } from '../../repositories/user.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllUsers(params: {
  limit: number
  offset: number
}): Promise<{ data: ReturnType<User['toJSON']>[]; total: number; limit: number; offset: number }> {
  const { users, total } = await UserRepository.findAllPaginated(params.limit, params.offset)
  return {
    data: users.map((u) => u.toJSON()),
    total,
    limit: params.limit,
    offset: params.offset,
  }
}

export async function getUserById(id: string): Promise<User> {
  const user = await UserRepository.findById(id)
  if (!user) throw notFound('User', id)
  return user
}
