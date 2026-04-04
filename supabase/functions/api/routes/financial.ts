import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { FinancialRepository } from '../repositories/financial.repository.ts'
import { HttpError } from '../errors.ts'

const financial = new Hono()
financial.use('*', authMiddleware)

financial.get('/entries', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)
  const type = c.req.query('type')
  const date_from = c.req.query('date_from')
  const date_to = c.req.query('date_to')

  try {
    const result = await FinancialRepository.findEntries({ type, date_from, date_to, limit, offset })
    return c.json(result)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

financial.get('/report', async (c) => {
  const date_from = c.req.query('date_from')
  const date_to = c.req.query('date_to')

  if (!date_from || !date_to) {
    return c.json({ error: 'date_from and date_to are required' }, 400)
  }

  try {
    const report = await FinancialRepository.getReport({ date_from, date_to })
    return c.json(report)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const financialRoutes = financial
