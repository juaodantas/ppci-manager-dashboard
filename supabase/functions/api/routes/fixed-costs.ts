import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createFixedCost } from '../use-cases/fixed-cost/create-fixed-cost.ts'
import { getAllFixedCosts, getFixedCostById } from '../use-cases/fixed-cost/get-fixed-costs.ts'
import { updateFixedCost } from '../use-cases/fixed-cost/update-fixed-cost.ts'
import { deleteFixedCost } from '../use-cases/fixed-cost/delete-fixed-cost.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { createFixedCostSchema, updateFixedCostSchema } from '../validation/schemas.ts'

const fixedCosts = new Hono()
fixedCosts.use('*', authMiddleware)

fixedCosts.get('/', async (c) => {
  const includeInactive = c.req.query('include_inactive') === 'true'
  const result = await getAllFixedCosts(includeInactive)
  return c.json(result)
})

fixedCosts.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createFixedCostSchema, body)
  try {
    const fc = await createFixedCost(dto)
    return c.json(fc, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

fixedCosts.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const fc = await getFixedCostById(id)
    return c.json(fc)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

fixedCosts.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateFixedCostSchema, body)
  try {
    const fc = await updateFixedCost(id, dto)
    return c.json(fc)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

fixedCosts.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deleteFixedCost(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const fixedCostRoutes = fixedCosts
