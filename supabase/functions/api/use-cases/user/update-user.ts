import * as bcrypt from 'npm:bcryptjs'
import { User } from '../../../_shared/domain/entities/user.entity.ts'
import { UserRepository } from '../../repositories/user.repository.ts'
import { notFound } from '../../errors.ts'

export interface UpdateUserDto {
  name?: string
  password?: string
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User> {
  const user = await UserRepository.findById(id)
  if (!user) throw notFound('User', id)

  if (dto.name) user.updateProfile(dto.name)

  if (dto.password) {
    user.passwordHash = await bcrypt.hash(dto.password, 10)
    user.updatedAt = new Date()
  }

  return UserRepository.save(user)
}
