import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import {
  getServiceCatalog,
  getServiceCatalogById,
  getCategories,
} from '../use-cases/service-catalog/get-service-catalog.ts'
import { createService } from '../use-cases/service-catalog/create-service.ts'
import { updateService } from '../use-cases/service-catalog/update-service.ts'
import { deactivateService } from '../use-cases/service-catalog/deactivate-service.ts'
import { addServicePrice } from '../use-cases/service-catalog/add-service-price.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import {
  createServiceCatalogSchema,
  updateServiceCatalogSchema,
  addServicePriceSchema,
} from '../validation/schemas.ts'

const serviceCatalog = new Hono()
serviceCatalog.use('*', authMiddleware)

serviceCatalog.get('/', async (c) => {
  const includeInactive = c.req.query('include_inactive') === 'true'
  const result = await getServiceCatalog(includeInactive)
  return c.json(result)
})

serviceCatalog.get('/categories', async (c) => {
  const categories = await getCategories()
  return c.json(categories)
})

serviceCatalog.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const item = await getServiceCatalogById(id)
    return c.json(item)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

serviceCatalog.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createServiceCatalogSchema, body)

  try {
    const item = await createService(dto)
    return c.json(item, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

serviceCatalog.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateServiceCatalogSchema, body)

  try {
    const item = await updateService(id, dto)
    return c.json(item)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

serviceCatalog.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deactivateService(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

serviceCatalog.post('/:id/prices', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(addServicePriceSchema, body)

  try {
    const price = await addServicePrice(id, dto)
    return c.json(price, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const serviceCatalogRoutes = serviceCatalog
