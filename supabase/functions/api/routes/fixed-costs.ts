import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createFixedCost } from '../use-cases/fixed-cost/create-fixed-cost.ts'
import { getAllFixedCosts, getFixedCostById } from '../use-cases/fixed-cost/get-fixed-costs.ts'
import { updateFixedCost } from '../use-cases/fixed-cost/update-fixed-cost.ts'
import { deleteFixedCost } from '../use-cases/fixed-cost/delete-fixed-cost.ts'
import { createFixedCostInterest } from '../use-cases/fixed-cost-interest/create-fixed-cost-interest.ts'
import { deleteFixedCostInterest } from '../use-cases/fixed-cost-interest/delete-fixed-cost-interest.ts'
import { getFixedCostInterests } from '../use-cases/fixed-cost-interest/get-fixed-cost-interests.ts'
import { updateFixedCostInterest } from '../use-cases/fixed-cost-interest/update-fixed-cost-interest.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import {
  createFixedCostInterestSchema,
  createFixedCostSchema,
  fixedCostInterestListQuerySchema,
  fixedCostListQuerySchema,
  updateFixedCostInterestSchema,
  updateFixedCostSchema,
} from '../validation/schemas.ts'

const fixedCosts = new Hono()
fixedCosts.use('*', authMiddleware)

fixedCosts.get('/', async (c) => {
  const includeInactive = c.req.query('include_inactive') === 'true'
  const query = {
    date_from: c.req.query('date_from') ?? undefined,
    date_to: c.req.query('date_to') ?? undefined,
  }
  const { date_from, date_to } = validateBody(fixedCostListQuerySchema, query)
  const result = await getAllFixedCosts({ includeInactive, date_from, date_to })
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

fixedCosts.get('/:id/interests', async (c) => {
  const fixedCostId = c.req.param('id')
  const query = {
    reference_year: c.req.query('reference_year') ?? undefined,
  }
  const { reference_year } = validateBody(fixedCostInterestListQuerySchema, query)
  try {
    const interests = await getFixedCostInterests(fixedCostId, reference_year)
    return c.json(interests)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

fixedCosts.post('/:id/interests', async (c) => {
  const fixedCostId = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(createFixedCostInterestSchema, body)
  try {
    const interest = await createFixedCostInterest(fixedCostId, dto)
    return c.json(interest, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

fixedCosts.put('/:id/interests/:interestId', async (c) => {
  const fixedCostId = c.req.param('id')
  const interestId = c.req.param('interestId')
  const body = await c.req.json()
  const dto = validateBody(updateFixedCostInterestSchema, body)
  try {
    const interest = await updateFixedCostInterest(fixedCostId, interestId, dto)
    return c.json(interest)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

fixedCosts.delete('/:id/interests/:interestId', async (c) => {
  const fixedCostId = c.req.param('id')
  const interestId = c.req.param('interestId')
  try {
    await deleteFixedCostInterest(fixedCostId, interestId)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const fixedCostRoutes = fixedCosts
