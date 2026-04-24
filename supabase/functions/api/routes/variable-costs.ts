import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createVariableCost } from '../use-cases/variable-cost/create-variable-cost.ts'
import { getAllVariableCosts, getVariableCostById } from '../use-cases/variable-cost/get-variable-costs.ts'
import { updateVariableCost } from '../use-cases/variable-cost/update-variable-cost.ts'
import { deleteVariableCost } from '../use-cases/variable-cost/delete-variable-cost.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { createVariableCostSchema, updateVariableCostSchema } from '../validation/schemas.ts'

const variableCosts = new Hono()
variableCosts.use('*', authMiddleware)

variableCosts.get('/', async (c) => {
  const date_from = c.req.query('date_from')
  const date_to = c.req.query('date_to')
  const company_id = c.req.query('company_id')
  const result = await getAllVariableCosts({ date_from, date_to, company_id })
  return c.json(result)
})

variableCosts.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createVariableCostSchema, body)
  try {
    const vc = await createVariableCost(dto)
    return c.json(vc, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

variableCosts.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const vc = await getVariableCostById(id)
    return c.json(vc)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

variableCosts.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateVariableCostSchema, body)
  try {
    const vc = await updateVariableCost(id, dto)
    return c.json(vc)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

variableCosts.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deleteVariableCost(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const variableCostRoutes = variableCosts
