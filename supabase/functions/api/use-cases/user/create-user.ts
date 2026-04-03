import * as bcrypt from 'npm:bcryptjs'
import { User } from '../../../_shared/domain/entities/user.entity.ts'
import { Email } from '../../../_shared/domain/value-objects/email.vo.ts'
import { UserRepository } from '../../repositories/user.repository.ts'
import { conflict } from '../../errors.ts'

export interface CreateUserDto {
  name: string
  email: string
  password: string
}

export async function createUser(dto: CreateUserDto): Promise<User> {
  const existing = await UserRepository.findByEmail(dto.email)
  if (existing) throw conflict('Email already in use')

  const passwordHash = await bcrypt.hash(dto.password, 10)
  const now = new Date()
  const user = new User(
    crypto.randomUUID(),
    dto.name,
    new Email(dto.email),
    passwordHash,
    now,
    now,
  )

  return UserRepository.save(user)
}
