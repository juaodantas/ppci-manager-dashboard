import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createCustomer } from '../use-cases/customer/create-customer.ts'
import { getAllCustomers, getCustomerById } from '../use-cases/customer/get-customer.ts'
import { updateCustomer } from '../use-cases/customer/update-customer.ts'
import { deleteCustomer } from '../use-cases/customer/delete-customer.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { createCustomerSchema, updateCustomerSchema } from '../validation/schemas.ts'

const customers = new Hono()
customers.use('*', authMiddleware)

customers.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const offset = Number(c.req.query('offset') ?? 0)
  const result = await getAllCustomers(limit, offset)
  return c.json(result)
})

customers.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createCustomerSchema, body)

  try {
    const customer = await createCustomer(dto)
    return c.json(customer, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

customers.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const customer = await getCustomerById(id)
    return c.json(customer)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

customers.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateCustomerSchema, body)

  try {
    const customer = await updateCustomer(id, dto)
    return c.json(customer)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

customers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deleteCustomer(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const customerRoutes = customers
