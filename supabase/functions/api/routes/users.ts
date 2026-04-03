import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createUser } from '../use-cases/user/create-user.ts'
import { getAllUsers, getUserById } from '../use-cases/user/get-user.ts'
import { updateUser } from '../use-cases/user/update-user.ts'
import { deleteUser } from '../use-cases/user/delete-user.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { createUserSchema, updateUserSchema } from '../validation/schemas.ts'

const users = new Hono()
users.use('*', authMiddleware)

users.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createUserSchema, body)

  try {
    const user = await createUser({ name: dto.name, email: dto.email, password: dto.password })
    return c.json(user.toJSON(), 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

users.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const offset = Number(c.req.query('offset') ?? 0)
  const result = await getAllUsers({ limit, offset })
  return c.json(result)
})

users.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const user = await getUserById(id)
    return c.json(user.toJSON())
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

users.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateUserSchema, body)

  try {
    const user = await updateUser(id, { name: dto.name, password: dto.password })
    return c.json(user.toJSON())
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

users.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deleteUser(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const userRoutes = users
