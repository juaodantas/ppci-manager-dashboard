import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createPayment } from '../use-cases/payment/create-payment.ts'
import { getAllPayments, getPaymentById } from '../use-cases/payment/get-payment.ts'
import { payPayment } from '../use-cases/payment/pay-payment.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import { createPaymentSchema, payPaymentSchema } from '../validation/schemas.ts'

const payments = new Hono()
payments.use('*', authMiddleware)

payments.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const offset = Number(c.req.query('offset') ?? 0)
  const project_id = c.req.query('project_id')
  const status = c.req.query('status')
  const result = await getAllPayments({ project_id, status, limit, offset })
  return c.json(result)
})

payments.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createPaymentSchema, body)
  try {
    const payment = await createPayment(dto)
    return c.json(payment, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

payments.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const payment = await getPaymentById(id)
    return c.json(payment)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

payments.put('/:id/pay', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(payPaymentSchema, body)
  try {
    const payment = await payPayment(id, dto)
    return c.json(payment)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const paymentRoutes = payments
