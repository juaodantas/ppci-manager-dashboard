import sql from '../db.ts'
import { VariableCost } from '../../_shared/domain/entities/variable-cost.entity.ts'

type VariableCostRow = {
  id: string
  name: string
  amount: number
  interest_amount: number
  date: string
  category: string | null
  description: string | null
  company_id: string | null
  created_at: string
  updated_at: string
}

function toVariableCost(row: VariableCostRow): VariableCost {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    interest_amount: row.interest_amount,
    date: row.date,
    category: row.category,
    description: row.description,
    company_id: row.company_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export const VariableCostRepository = {
  async findAll(params: { date_from?: string; date_to?: string; company_id?: string }): Promise<VariableCost[]> {
    const { date_from, date_to, company_id } = params
    let query: ReturnType<typeof sql>
    if (date_from && date_to) {
      query = await sql`
        SELECT * FROM variable_costs
        WHERE date >= ${date_from}::date AND date <= ${date_to}::date
        AND (${company_id ?? null}::uuid IS NULL OR company_id = ${company_id ?? null}::uuid)
        ORDER BY date DESC
      `
    } else if (date_from) {
      query = await sql`
        SELECT * FROM variable_costs
        WHERE date >= ${date_from}::date
        AND (${company_id ?? null}::uuid IS NULL OR company_id = ${company_id ?? null}::uuid)
        ORDER BY date DESC
      `
    } else if (date_to) {
      query = await sql`
        SELECT * FROM variable_costs
        WHERE date <= ${date_to}::date
        AND (${company_id ?? null}::uuid IS NULL OR company_id = ${company_id ?? null}::uuid)
        ORDER BY date DESC
      `
    } else {
      query = await sql`
        SELECT * FROM variable_costs
        WHERE (${company_id ?? null}::uuid IS NULL OR company_id = ${company_id ?? null}::uuid)
        ORDER BY date DESC
      `
    }
    return (query as VariableCostRow[]).map(toVariableCost)
  },

  async findById(id: string): Promise<VariableCost | null> {
    const rows = await sql`SELECT * FROM variable_costs WHERE id = ${id}`
    return rows.length > 0 ? toVariableCost(rows[0]) : null
  },

  async save(data: {
    name: string
    amount: number
    interest_amount?: number
    date: string
    category?: string
    description?: string
    company_id?: string | null
  }): Promise<VariableCost> {
    const rows = await sql`
      INSERT INTO variable_costs (name, amount, interest_amount, date, category, description, company_id)
      VALUES (
        ${data.name},
        ${data.amount},
        ${data.interest_amount ?? 0},
        ${data.date}::date,
        ${data.category ?? null},
        ${data.description ?? null},
        ${data.company_id ?? null}
      )
      RETURNING *
    `
    return toVariableCost(rows[0])
  },

  async update(
    id: string,
    data: {
      name?: string
      amount?: number
      interest_amount?: number
      date?: string
      category?: string
      description?: string
      company_id?: string | null
    },
  ): Promise<VariableCost | null> {
    const rows = await sql`
      UPDATE variable_costs
      SET
        name = COALESCE(${data.name ?? null}, name),
        amount = COALESCE(${data.amount ?? null}::numeric, amount),
        interest_amount = COALESCE(${data.interest_amount ?? null}::numeric, interest_amount),
        date = COALESCE(${data.date ?? null}::date, date),
        category = COALESCE(${data.category ?? null}, category),
        description = COALESCE(${data.description ?? null}, description),
        company_id = COALESCE(${data.company_id ?? null}::uuid, company_id),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return rows.length > 0 ? toVariableCost(rows[0]) : null
  },

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM variable_costs WHERE id = ${id}`
  },
}
