import sql from '../db.ts'
import { FinancialEntry, FinancialReport } from '../../_shared/domain/entities/financial-entry.entity.ts'

// deno-lint-ignore no-explicit-any
function toFinancialEntry(row: Record<string, any>): FinancialEntry {
  return {
    id: row.id as string,
    type: row.type as FinancialEntry['type'],
    source_type: row.source_type as FinancialEntry['source_type'],
    source_id: row.source_id as string,
    amount: row.amount as number,
    date: row.date as string,
    description: row.description as string | null,
    created_at: row.created_at as string,
  }
}

export const FinancialRepository = {
  async findEntries(params: {
    type?: string
    date_from?: string
    date_to?: string
    limit: number
    offset: number
  }): Promise<{ entries: FinancialEntry[]; total: number }> {
    const { type, date_from, date_to, limit, offset } = params

    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM financial_entries
      WHERE
        (${type ?? null}::text IS NULL OR type = ${type ?? null}::text)
        AND (${date_from ?? null} IS NULL OR date >= ${date_from ?? null}::date)
        AND (${date_to ?? null} IS NULL OR date <= ${date_to ?? null}::date)
      ORDER BY date DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { entries: rows.map(toFinancialEntry), total }
  },

  async getReport(params: { date_from: string; date_to: string }): Promise<FinancialReport> {
    const { date_from, date_to } = params

    const [summary] = await sql`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float  AS total_income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float AS total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::float AS balance
      FROM financial_entries
      WHERE date BETWEEN ${date_from}::date AND ${date_to}::date
    `

    const monthRows = await sql`
      SELECT
        date_trunc('month', date)::date::text AS month,
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float  AS income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float AS expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::float AS balance
      FROM financial_entries
      WHERE date BETWEEN ${date_from}::date AND ${date_to}::date
      GROUP BY date_trunc('month', date)
      ORDER BY date_trunc('month', date) ASC
    `

    return {
      total_income: summary.total_income as number,
      total_expense: summary.total_expense as number,
      balance: summary.balance as number,
      entries_by_month: monthRows.map((r) => ({
        month: r.month as string,
        income: r.income as number,
        expense: r.expense as number,
        balance: r.balance as number,
      })),
    }
  },
}
