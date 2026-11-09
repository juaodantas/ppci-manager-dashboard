import sql from '../db.ts'
import { Quote, QuoteItem } from '../../_shared/domain/entities/quote.entity.ts'
import { badRequest, notFound } from '../errors.ts'
import type { UpdateQuoteDto } from '../validation/schemas.ts'

type Transaction = Parameters<Parameters<typeof sql.begin>[1]>[0]

// Always use the transaction connection here: the shared pool has max: 1.
async function loadQuote(tx: Transaction, id: string): Promise<Quote> {
  const rows = await tx`SELECT * FROM quotes WHERE id = ${id}`
  const items = await tx`SELECT * FROM quote_items WHERE quote_id = ${id} ORDER BY id`
  return toQuote(rows[0], items.map(toQuoteItem))
}

async function lockEditableQuote(tx: Transaction, id: string, action: string): Promise<void> {
  const rows = await tx`SELECT status FROM quotes WHERE id = ${id} FOR UPDATE`
  if (rows.length === 0) throw notFound('Quote', id)
  if (rows[0].status !== 'draft' && rows[0].status !== 'sent') {
    throw badRequest(`Cannot ${action} a quote with status "${rows[0].status}"`)
  }
}

function rethrowWriteError(error: unknown): never {
  const code = (error as { code?: string })?.code
  if (code === '23503') throw badRequest('Referenced service or company does not exist')
  if (code === '22003') throw badRequest('Quote amounts exceed the supported numeric range')
  throw error
}

// deno-lint-ignore no-explicit-any
function toQuoteItem(row: Record<string, any>): QuoteItem {
  return {
    id: row.id as string,
    quote_id: row.quote_id as string,
    service_id: row.service_id as string,
    description: row.description as string | undefined,
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    total_price: Number(row.total_price),
  }
}

// deno-lint-ignore no-explicit-any
function toQuote(row: Record<string, any>, items?: QuoteItem[]): Quote {
  return {
    id: row.id as string,
    customer_id: row.customer_id as string,
    company_id: row.company_id ?? null,
    status: row.status as Quote['status'],
    total_amount: Number(row.total_amount),
    discount: Number(row.discount),
    valid_until: row.valid_until ?? null,
    notes: row.notes ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    items,
  }
}

export const QuoteRepository = {
  async findAll(params: {
    limit: number
    offset: number
    status?: string
    customer_id?: string
  }): Promise<{ quotes: Quote[]; total: number }> {
    const { limit, offset, status, customer_id } = params

    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM quotes
      WHERE
        (${status ?? null}::text IS NULL OR status = ${status ?? null}::quote_status_enum)
        AND (${customer_id ?? null}::uuid IS NULL OR customer_id = ${customer_id ?? null}::uuid)
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { quotes: rows.map((r) => toQuote(r)), total }
  },

  async findById(id: string): Promise<Quote | null> {
    const rows = await sql`SELECT * FROM quotes WHERE id = ${id}`
    if (rows.length === 0) return null

    const itemRows = await sql`SELECT * FROM quote_items WHERE quote_id = ${id} ORDER BY id`
    const items = itemRows.map(toQuoteItem)

    return toQuote(rows[0], items)
  },

  async save(data: {
    customer_id: string
    company_id?: string
    valid_until?: string
    discount?: number
    notes?: string
    items: { service_id: string; quantity: number; unit_price: number; description?: string }[]
  }): Promise<Quote> {
    const { customer_id, company_id, valid_until, discount, notes, items } = data

    const quoteRows = await sql`
      INSERT INTO quotes (customer_id, company_id, valid_until, discount, notes)
      VALUES (
        ${customer_id},
        ${company_id ?? null},
        ${valid_until ?? null},
        ${discount ?? 0},
        ${notes ?? null}
      )
      RETURNING *
    `
    const quote = quoteRows[0]

    for (const item of items) {
      await sql`
        INSERT INTO quote_items (quote_id, service_id, quantity, unit_price, description)
        VALUES (
          ${quote.id},
          ${item.service_id},
          ${item.quantity},
          ${item.unit_price},
          ${item.description ?? null}
        )
      `
    }

    return (await this.findById(quote.id as string))!
  },

  async update(
    id: string,
    data: UpdateQuoteDto,
  ): Promise<Quote> {
    try {
      return await sql.begin(async (tx) => {
        await lockEditableQuote(tx, id, 'update')
        if (data.company_id !== undefined) {
          const companies = await tx`SELECT type FROM companies WHERE id = ${data.company_id}`
          if (companies.length === 0 || companies[0].type !== 'internal') {
            throw badRequest('company_id must reference a company of type internal')
          }
        }

        await tx`
          UPDATE quotes
          SET
            valid_until = CASE WHEN ${data.valid_until !== undefined} THEN ${data.valid_until ?? null}::date ELSE valid_until END,
            discount = COALESCE(${data.discount ?? null}, discount),
            notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null}::text ELSE notes END,
            status = COALESCE(${data.status ?? null}::quote_status_enum, status),
            company_id = COALESCE(${data.company_id ?? null}::uuid, company_id),
            updated_at = now()
          WHERE id = ${id}
        `

        if (data.items !== undefined) {
          await tx`DELETE FROM quote_items WHERE quote_id = ${id}`
          for (const item of data.items) {
            await tx`
              INSERT INTO quote_items (quote_id, service_id, quantity, unit_price, description)
              VALUES (
                ${id},
                ${item.service_id},
                ${item.quantity},
                ${item.unit_price},
                ${item.description ?? null}
              )
            `
          }
        }

        // PostgreSQL's per-line numeric rounding and subtotal trigger are authoritative.
        const updated = await loadQuote(tx, id)
        if (updated.discount < 0 || updated.discount > updated.total_amount) {
          throw badRequest('discount must not exceed the quote subtotal')
        }
        return updated
      })
    } catch (error) {
      rethrowWriteError(error)
    }
  },

  async updateStatus(id: string, status: Quote['status']): Promise<void> {
    await sql`UPDATE quotes SET status = ${status}::quote_status_enum, updated_at = now() WHERE id = ${id}`
  },

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM quotes WHERE id = ${id}`
  },

  async approve(
    id: string,
    projectData: { name: string; start_date?: string },
  ): Promise<{ project_id: string }> {
    try {
      return await sql.begin(async (tx) => {
        await lockEditableQuote(tx, id, 'approve')
        const quote = await loadQuote(tx, id)
        await tx`UPDATE quotes SET status = 'approved'::quote_status_enum, updated_at = now() WHERE id = ${id}`

        const totalValue = quote.total_amount - quote.discount
        const projectRows = await tx`
          INSERT INTO projects (customer_id, quote_id, name, start_date, total_value, company_id)
          VALUES (
            ${quote.customer_id},
            ${quote.id},
            ${projectData.name},
            ${projectData.start_date ?? null},
            ${totalValue},
            ${quote.company_id ?? null}
          )
          RETURNING id
        `
        const projectId = projectRows[0].id as string

        for (const item of quote.items ?? []) {
          await tx`
            INSERT INTO project_services (project_id, service_id, quantity, unit_price, description)
            VALUES (
              ${projectId},
              ${item.service_id},
              ${item.quantity},
              ${item.unit_price},
              ${item.description ?? null}
            )
          `
        }

        // project_services' trigger recalculates the gross amount; restore the net snapshot last.
        await tx`UPDATE projects SET total_value = ${totalValue} WHERE id = ${projectId}`
        return { project_id: projectId }
      })
    } catch (error) {
      rethrowWriteError(error)
    }
  },
}
