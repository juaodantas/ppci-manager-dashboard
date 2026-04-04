import sql from '../db.ts'
import { FixedCost } from '../../_shared/domain/entities/fixed-cost.entity.ts'

// deno-lint-ignore no-explicit-any
function toFixedCost(row: Record<string, any>): FixedCost {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: row.amount as number,
    due_day: row.due_day as number,
    category: row.category as string | null,
    active: row.active as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export const FixedCostRepository = {
  async findAll(includeInactive = false): Promise<FixedCost[]> {
    const rows = await sql`
      SELECT *
      FROM fixed_costs
      WHERE (${includeInactive} OR active = true)
      ORDER BY name ASC
    `
    return rows.map(toFixedCost)
  },

  async findById(id: string): Promise<FixedCost | null> {
    const rows = await sql`SELECT * FROM fixed_costs WHERE id = ${id}`
    return rows.length > 0 ? toFixedCost(rows[0]) : null
  },

  async save(data: {
    name: string
    amount: number
    due_day: number
    category?: string
  }): Promise<FixedCost> {
    const rows = await sql`
      INSERT INTO fixed_costs (name, amount, due_day, category)
      VALUES (
        ${data.name},
        ${data.amount},
        ${data.due_day},
        ${data.category ?? null}
      )
      RETURNING *
    `
    return toFixedCost(rows[0])
  },

  async update(
    id: string,
    data: {
      name?: string
      amount?: number
      due_day?: number
      category?: string
    },
  ): Promise<FixedCost | null> {
    const rows = await sql`
      UPDATE fixed_costs
      SET
        name       = COALESCE(${data.name ?? null}, name),
        amount     = COALESCE(${data.amount ?? null}::numeric, amount),
        due_day    = COALESCE(${data.due_day ?? null}::int, due_day),
        category   = COALESCE(${data.category ?? null}, category),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return rows.length > 0 ? toFixedCost(rows[0]) : null
  },

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM fixed_costs WHERE id = ${id}`
  },
}
