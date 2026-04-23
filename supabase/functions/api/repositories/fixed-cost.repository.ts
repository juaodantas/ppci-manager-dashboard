import sql from '../db.ts'
import { FixedCost } from '../../_shared/domain/entities/fixed-cost.entity.ts'

type FixedCostRow = {
  id: string
  name: string
  amount: number
  due_day: number
  category: string | null
  active: boolean
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

function toFixedCost(row: FixedCostRow): FixedCost {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    due_day: row.due_day,
    category: row.category,
    active: row.active,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export const FixedCostRepository = {
  async findAll(params: {
    includeInactive: boolean
    date_from?: string
    date_to?: string
  }): Promise<FixedCost[]> {
    const { includeInactive, date_from, date_to } = params
    const rows = await sql`
      SELECT *
      FROM fixed_costs
      WHERE (${includeInactive} OR active = true)
        AND (
          (${date_from ?? null}::date IS NULL OR COALESCE(end_date, '9999-12-31'::date) >= ${date_from ?? null}::date)
          AND (${date_to ?? null}::date IS NULL OR start_date <= ${date_to ?? null}::date)
        )
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
    start_date?: string
    end_date?: string | null
  }): Promise<FixedCost> {
    const rows = await sql`
      INSERT INTO fixed_costs (name, amount, due_day, category, start_date, end_date)
      VALUES (
        ${data.name},
        ${data.amount},
        ${data.due_day},
        ${data.category ?? null},
        COALESCE(${data.start_date ?? null}::date, CURRENT_DATE),
        ${data.end_date ?? null}::date
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
      start_date?: string
      end_date?: string | null
    },
  ): Promise<FixedCost | null> {
    const shouldUpdateEndDate = data.end_date !== undefined
    const rows = await sql`
      UPDATE fixed_costs
      SET
        name       = COALESCE(${data.name ?? null}, name),
        amount     = COALESCE(${data.amount ?? null}::numeric, amount),
        due_day    = COALESCE(${data.due_day ?? null}::int, due_day),
        category   = COALESCE(${data.category ?? null}, category),
        start_date = COALESCE(${data.start_date ?? null}::date, start_date),
        end_date   = CASE
          WHEN ${shouldUpdateEndDate} THEN ${data.end_date ?? null}::date
          ELSE end_date
        END,
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
