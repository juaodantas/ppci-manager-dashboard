import sql from '../db.ts'
import { VariableCost } from '../../_shared/domain/entities/variable-cost.entity.ts'

// deno-lint-ignore no-explicit-any
function toVariableCost(row: Record<string, any>): VariableCost {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: row.amount as number,
    date: row.date as string,
    category: row.category as string | null,
    description: row.description as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export const VariableCostRepository = {
  async findAll(date_from?: string, date_to?: string): Promise<VariableCost[]> {
    let query: ReturnType<typeof sql>
    if (date_from && date_to) {
      query = await sql`
        SELECT * FROM variable_costs
        WHERE date >= ${date_from}::date AND date <= ${date_to}::date
        ORDER BY date DESC
      `
    } else if (date_from) {
      query = await sql`
        SELECT * FROM variable_costs
        WHERE date >= ${date_from}::date
        ORDER BY date DESC
      `
    } else if (date_to) {
      query = await sql`
        SELECT * FROM variable_costs
        WHERE date <= ${date_to}::date
        ORDER BY date DESC
      `
    } else {
      query = await sql`
        SELECT * FROM variable_costs
        ORDER BY date DESC
      `
    }
    return (query as any[]).map(toVariableCost)
  },

  async findById(id: string): Promise<VariableCost | null> {
    const rows = await sql`SELECT * FROM variable_costs WHERE id = ${id}`
    return rows.length > 0 ? toVariableCost(rows[0]) : null
  },

  async save(data: {
    name: string
    amount: number
    date: string
    category?: string
    description?: string
  }): Promise<VariableCost> {
    const rows = await sql`
      INSERT INTO variable_costs (name, amount, date, category, description)
      VALUES (
        ${data.name},
        ${data.amount},
        ${data.date}::date,
        ${data.category ?? null},
        ${data.description ?? null}
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
      date?: string
      category?: string
      description?: string
    },
  ): Promise<VariableCost | null> {
    const rows = await sql`
      UPDATE variable_costs
      SET
        name        = COALESCE(${data.name ?? null}, name),
        amount      = COALESCE(${data.amount ?? null}::numeric, amount),
        date        = COALESCE(${data.date ?? null}::date, date),
        category    = COALESCE(${data.category ?? null}, category),
        description = COALESCE(${data.description ?? null}, description),
        updated_at  = now()
      WHERE id = ${id}
      RETURNING *
    `
    return rows.length > 0 ? toVariableCost(rows[0]) : null
  },

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM variable_costs WHERE id = ${id}`
  },
}
