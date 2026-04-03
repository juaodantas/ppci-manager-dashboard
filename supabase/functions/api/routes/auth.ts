import { Hono } from 'npm:hono'
import { login, logout, refreshAccessToken } from '../use-cases/auth.ts'
import { createUser } from '../use-cases/user/create-user.ts'
import { generateToken } from '../use-cases/auth.ts'
import { RefreshTokenRepository } from '../repositories/refresh-token.repository.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { registerSchema, loginSchema, refreshSchema } from '../validation/schemas.ts'

const auth = new Hono()

auth.post('/register', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(registerSchema, body)

  try {
    const user = await createUser({ name: dto.name, email: dto.email, password: dto.password })
    const access_token = await generateToken(user.id, user.email.value)
    const { token: refresh_token } = await RefreshTokenRepository.create(user.id)
    return c.json({ access_token, refresh_token }, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

auth.post('/login', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(loginSchema, body)

  try {
    const tokens = await login(dto.email, dto.password)
    return c.json(tokens)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

auth.post('/refresh', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(refreshSchema, body)

  try {
    const result = await refreshAccessToken(dto.refresh_token)
    return c.json(result)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

auth.post('/logout', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    if (body?.refresh_token) await logout(body.refresh_token)
    return c.json({ success: true })
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const authRoutes = auth
