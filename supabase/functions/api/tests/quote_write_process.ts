// Local integration subprocess: one independent pool/connection per process.
// Invoked only by quote_edit_local.py, never mounted as an API route.
import sql from '../db.ts'
import { updateQuote } from '../use-cases/quote/update-quote.ts'
import { approveQuote } from '../use-cases/quote/approve-quote.ts'
import { updateQuoteSchema, approveQuoteSchema } from '../validation/schemas.ts'
import { validateBody } from '../validation/validate.ts'
import { HttpError } from '../errors.ts'

const url = new URL(Deno.env.get('DATABASE_URL')!)
if (url.hostname !== '127.0.0.1') throw new Error('Local database only')

try {
  const { action, id, body } = await new Response(Deno.stdin.readable).json()
  const data = action === 'update'
    ? await updateQuote(id, validateBody(updateQuoteSchema, body))
    : await approveQuote(id, validateBody(approveQuoteSchema, body))
  console.log(JSON.stringify({ status: 200, data }))
} catch (error) {
  if (!(error instanceof HttpError)) throw error
  console.log(JSON.stringify({ status: error.status, data: { error: error.message } }))
} finally {
  await sql.end()
}
