import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { FinancialRepository } from '../repositories/financial.repository.ts'
import { badRequest, forbidden, HttpError } from '../errors.ts'
import { financialAnalyticsQuerySchema } from '../validation/schemas.ts'
import { isCompanyInScope } from './financial-analytics.auth.ts'

const financial = new Hono()
financial.use('*', authMiddleware)

financial.get('/entries', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)
  const type = c.req.query('type')
  const date_from = c.req.query('date_from')
  const date_to = c.req.query('date_to')
  const company_id = c.req.query('company_id')

  try {
    const result = await FinancialRepository.findEntries({ type, date_from, date_to, company_id, limit, offset })
    return c.json(result)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

financial.get('/report', async (c) => {
  const date_from = c.req.query('date_from')
  const date_to = c.req.query('date_to')
  const company_id = c.req.query('company_id')

  if (!date_from || !date_to) {
    return c.json({ error: 'date_from and date_to are required' }, 400)
  }

  try {
    const report = await FinancialRepository.getReport({ date_from, date_to, company_id })
    return c.json(report)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

financial.get('/analytics', async (c) => {
  try {
    const queryParse = financialAnalyticsQuerySchema.safeParse({
      company_id: c.req.query('company_id'),
      date_from: c.req.query('date_from'),
      date_to: c.req.query('date_to'),
      horizon_months: c.req.query('horizon_months'),
    })

    if (!queryParse.success) {
      const message = queryParse.error.errors[0]?.message ?? 'Invalid query parameters'
      throw badRequest(message)
    }

    const payload = (c.get('jwtPayload') ?? {}) as { company_id?: string; company_ids?: string[] }
    if (!isCompanyInScope(payload, queryParse.data.company_id)) {
      throw forbidden('company_id is outside your scope')
    }

    const analytics = await FinancialRepository.getAnalytics(queryParse.data)
    return c.json(analytics)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const financialRoutes = financial
