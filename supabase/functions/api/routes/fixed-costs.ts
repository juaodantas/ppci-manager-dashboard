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
import { getFixedCostMonth } from '../use-cases/fixed-cost-month/get-fixed-cost-month.ts'
import {
  FixedCostMonthEntryEditError,
  upsertFixedCostMonthEntry,
} from '../use-cases/fixed-cost-month/upsert-fixed-cost-month-entry.ts'
import { confirmFixedCostMonth } from '../use-cases/fixed-cost-month/confirm-fixed-cost-month.ts'
import { closeFixedCostMonth } from '../use-cases/fixed-cost-month/close-fixed-cost-month.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import {
  fixedCostMonthActionParamsSchema,
  fixedCostMonthParamsSchema,
  fixedCostMonthQuerySchema,
  upsertFixedCostMonthEntrySchema,
} from '../validation/fixed-cost-month.schemas.ts'
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

function fixedCostMonthErrorResponse(err: HttpError): { error: string; reason?: string } {
  if (err instanceof FixedCostMonthEntryEditError) return { error: err.message, reason: err.reason }
  return { error: err.message }
}

fixedCosts.get('/monthly', async (c) => {
  const query = validateBody(fixedCostMonthQuerySchema, {
    reference_year: c.req.query('reference_year') ?? undefined,
    reference_month: c.req.query('reference_month') ?? undefined,
    company_id: c.req.query('company_id') ?? undefined,
  })
  try {
    const result = await getFixedCostMonth(query)
    return c.json(result)
  } catch (err) {
    if (err instanceof HttpError) return c.json(fixedCostMonthErrorResponse(err), err.status)
    throw err
  }
})

fixedCosts.put('/:id/monthly/:reference_year/:reference_month', async (c) => {
  const params = validateBody(fixedCostMonthParamsSchema, {
    id: c.req.param('id'),
    reference_year: c.req.param('reference_year'),
    reference_month: c.req.param('reference_month'),
  })
  const body = await c.req.json()
  const dto = validateBody(upsertFixedCostMonthEntrySchema, body)
  try {
    const result = await upsertFixedCostMonthEntry({
      fixedCostId: params.id,
      referenceYear: params.reference_year,
      referenceMonth: params.reference_month,
      dto,
    })
    return c.json(result)
  } catch (err) {
    if (err instanceof HttpError) return c.json(fixedCostMonthErrorResponse(err), err.status)
    throw err
  }
})

fixedCosts.post('/monthly/:reference_year/:reference_month/confirm', async (c) => {
  const params = validateBody(fixedCostMonthActionParamsSchema, {
    reference_year: c.req.param('reference_year'),
    reference_month: c.req.param('reference_month'),
    company_id: c.req.query('company_id') ?? undefined,
  })
  try {
    const result = await confirmFixedCostMonth({
      referenceYear: params.reference_year,
      referenceMonth: params.reference_month,
      companyId: params.company_id,
    })
    return c.json(result)
  } catch (err) {
    if (err instanceof HttpError) return c.json(fixedCostMonthErrorResponse(err), err.status)
    throw err
  }
})

fixedCosts.post('/monthly/:reference_year/:reference_month/close', async (c) => {
  const params = validateBody(fixedCostMonthActionParamsSchema, {
    reference_year: c.req.param('reference_year'),
    reference_month: c.req.param('reference_month'),
    company_id: c.req.query('company_id') ?? undefined,
  })
  try {
    const result = await closeFixedCostMonth({
      referenceYear: params.reference_year,
      referenceMonth: params.reference_month,
      companyId: params.company_id,
    })
    return c.json(result)
  } catch (err) {
    if (err instanceof HttpError) return c.json(fixedCostMonthErrorResponse(err), err.status)
    throw err
  }
})

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
