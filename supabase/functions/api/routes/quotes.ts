import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createQuote } from '../use-cases/quote/create-quote.ts'
import { getAllQuotes, getQuoteById } from '../use-cases/quote/get-quote.ts'
import { updateQuote } from '../use-cases/quote/update-quote.ts'
import { deleteQuote } from '../use-cases/quote/delete-quote.ts'
import { approveQuote } from '../use-cases/quote/approve-quote.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { createQuoteSchema, updateQuoteSchema, approveQuoteSchema } from '../validation/schemas.ts'

const quotes = new Hono()
quotes.use('*', authMiddleware)

quotes.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const offset = Number(c.req.query('offset') ?? 0)
  const status = c.req.query('status')
  const customer_id = c.req.query('customer_id')
  const result = await getAllQuotes({ limit, offset, status, customer_id })
  return c.json(result)
})

quotes.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createQuoteSchema, body)
  try {
    const quote = await createQuote(dto)
    return c.json(quote, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

quotes.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const quote = await getQuoteById(id)
    return c.json(quote)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

quotes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateQuoteSchema, body)
  try {
    const quote = await updateQuote(id, dto)
    return c.json(quote)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

quotes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deleteQuote(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

quotes.post('/:id/approve', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(approveQuoteSchema, body)
  try {
    const result = await approveQuote(id, dto)
    return c.json(result)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const quoteRoutes = quotes
