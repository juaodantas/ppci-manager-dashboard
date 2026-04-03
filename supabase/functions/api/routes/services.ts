import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createService } from '../use-cases/service/create-service.ts'
import {
  getAllServices,
  getServiceById,
  getServiceStats,
} from '../use-cases/service/get-service.ts'
import { updateService } from '../use-cases/service/update-service.ts'
import { deleteService } from '../use-cases/service/delete-service.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { createServiceSchema, updateServiceSchema } from '../validation/schemas.ts'

const services = new Hono()
services.use('*', authMiddleware)

services.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createServiceSchema, body)

  try {
    const service = await createService(dto)
    return c.json(service, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

services.get('/', async (c) => {
  const status = c.req.query('status')
  const clienteId = c.req.query('clienteId')
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const offset = Number(c.req.query('offset') ?? 0)

  const result = await getAllServices({ status, clienteId, limit, offset })
  return c.json(result)
})

services.get('/stats', async (c) => {
  return c.json(await getServiceStats())
})

services.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const service = await getServiceById(id)
    return c.json(service)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

services.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateServiceSchema, body)

  try {
    const service = await updateService(id, dto)
    return c.json(service)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

services.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deleteService(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const serviceRoutes = services
