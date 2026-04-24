import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createCompany } from '../use-cases/company/create-company.ts'
import { getAllCompanies, getCompanyById } from '../use-cases/company/get-company.ts'
import { updateCompany } from '../use-cases/company/update-company.ts'
import { deleteCompany } from '../use-cases/company/delete-company.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { createCompanySchema, updateCompanySchema } from '../validation/schemas.ts'

const companies = new Hono()
companies.use('*', authMiddleware)

companies.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const offset = Number(c.req.query('offset') ?? 0)
  const type = c.req.query('type') ?? undefined
  const result = await getAllCompanies({ type, limit, offset })
  return c.json(result)
})

companies.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createCompanySchema, body)

  try {
    const company = await createCompany(dto)
    return c.json(company, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

companies.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const company = await getCompanyById(id)
    return c.json(company)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

companies.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateCompanySchema, body)

  try {
    const company = await updateCompany(id, dto)
    return c.json(company)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

companies.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deleteCompany(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const companyRoutes = companies
