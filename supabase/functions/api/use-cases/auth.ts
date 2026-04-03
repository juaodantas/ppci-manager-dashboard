import * as bcrypt from 'npm:bcryptjs'
import { sign } from 'npm:hono/jwt'
import { UserRepository } from '../repositories/user.repository.ts'
import { RefreshTokenRepository } from '../repositories/refresh-token.repository.ts'
import { unauthorized } from '../errors.ts'

export async function login(
  email: string,
  password: string,
): Promise<{ access_token: string; refresh_token: string }> {
  const user = await UserRepository.findByEmail(email)
  if (!user) throw unauthorized()

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw unauthorized()

  const access_token = await generateToken(user.id, user.email.value)
  const { token: refresh_token } = await RefreshTokenRepository.create(user.id)

  return { access_token, refresh_token }
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string }> {
  const record = await RefreshTokenRepository.findValid(refreshToken)
  if (!record) throw unauthorized('Invalid or expired refresh token')

  const user = await UserRepository.findById(record.userId)
  if (!user) throw unauthorized('User not found')

  const access_token = await generateToken(user.id, user.email.value)
  return { access_token }
}

export async function logout(refreshToken: string): Promise<void> {
  await RefreshTokenRepository.revoke(refreshToken)
}

export async function generateToken(sub: string, email: string): Promise<string> {
  const secret = Deno.env.get('JWT_SECRET')
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  const exp = Math.floor(Date.now() / 1000) + 60 * 15 // 15 minutes
  return sign({ sub, email, exp }, secret)
}
