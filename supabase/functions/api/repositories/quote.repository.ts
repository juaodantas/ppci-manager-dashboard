import sql from '../db.ts'
import { Quote, QuoteItem } from '../../_shared/domain/entities/quote.entity.ts'

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
    data: {
      valid_until?: string | null
      discount?: number
      notes?: string | null
      status?: Quote['status']
      company_id?: string
      items?: { service_id: string; quantity: number; unit_price: number; description?: string }[]
    },
  ): Promise<Quote | null> {
    const rows = await sql`SELECT * FROM quotes WHERE id = ${id}`
    if (rows.length === 0) return null

    await sql`
      UPDATE quotes
      SET
        valid_until = COALESCE(${data.valid_until ?? null}, valid_until),
        discount = COALESCE(${data.discount ?? null}, discount),
        notes = COALESCE(${data.notes ?? null}, notes),
        status = COALESCE(${data.status ?? null}::quote_status_enum, status),
        company_id = COALESCE(${data.company_id ?? null}::uuid, company_id),
        updated_at = now()
      WHERE id = ${id}
    `

    if (data.items !== undefined) {
      await sql`DELETE FROM quote_items WHERE quote_id = ${id}`
      for (const item of data.items) {
        await sql`
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

    return this.findById(id)
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
    await sql`UPDATE quotes SET status = 'approved'::quote_status_enum, updated_at = now() WHERE id = ${id}`

    const quote = await this.findById(id)
    if (!quote) throw new Error('Quote not found after approve')

    const totalValue = quote.total_amount - quote.discount

    const projectRows = await sql`
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

    if (quote.items && quote.items.length > 0) {
      for (const item of quote.items) {
        await sql`
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
    }

    return { project_id: projectId }
  },
}
