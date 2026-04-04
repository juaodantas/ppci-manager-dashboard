import sql from '../db.ts'
import { Payment } from '../../_shared/domain/entities/payment.entity.ts'

// deno-lint-ignore no-explicit-any
function toPayment(row: Record<string, any>): Payment {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    amount: row.amount as number,
    due_date: row.due_date as string,
    paid_date: row.paid_date as string | null,
    status: row.status as Payment['status'],
    payment_method: row.payment_method as string | null,
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export const PaymentRepository = {
  async findAll(params: {
    project_id?: string
    status?: string
    limit: number
    offset: number
  }): Promise<{ payments: Payment[]; total: number }> {
    const { project_id, status, limit, offset } = params

    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM payments
      WHERE
        (${project_id ?? null}::uuid IS NULL OR project_id = ${project_id ?? null}::uuid)
        AND (${status ?? null} IS NULL OR status = ${status ?? null})
      ORDER BY due_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { payments: rows.map(toPayment), total }
  },

  async findById(id: string): Promise<Payment | null> {
    const rows = await sql`SELECT * FROM payments WHERE id = ${id}`
    return rows.length > 0 ? toPayment(rows[0]) : null
  },

  async save(data: {
    project_id: string
    amount: number
    due_date: string
    payment_method?: string
    notes?: string
  }): Promise<Payment> {
    const rows = await sql`
      INSERT INTO payments (project_id, amount, due_date, payment_method, notes)
      VALUES (
        ${data.project_id},
        ${data.amount},
        ${data.due_date},
        ${data.payment_method ?? null},
        ${data.notes ?? null}
      )
      RETURNING *
    `
    return toPayment(rows[0])
  },

  async pay(id: string, paid_date: string): Promise<Payment | null> {
    const rows = await sql`
      UPDATE payments
      SET
        paid_date  = ${paid_date},
        status     = 'paid',
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return rows.length > 0 ? toPayment(rows[0]) : null
  },
}
