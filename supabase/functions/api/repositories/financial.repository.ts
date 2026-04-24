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
    company_id?: string
    limit: number
    offset: number
  }): Promise<{ entries: FinancialEntry[]; total: number }> {
    const { type, date_from, date_to, company_id, limit, offset } = params

    // When a date range is provided, include fixed costs dynamically (one entry per month per active cost)
    // and variable costs for the period.
    const rows = date_from && date_to
      ? await sql`
          SELECT *, COUNT(*) OVER()::int AS total_count
          FROM (
      SELECT fe.id, fe.type::text, fe.source_type, fe.source_id, fe.amount::float, fe.date, fe.description, fe.created_at
      FROM financial_entries fe
      JOIN payments p ON p.id = fe.source_id AND fe.source_type = 'payment'
      JOIN projects pr ON pr.id = p.project_id
      WHERE
      (${type ?? null}::text IS NULL OR fe.type::text = ${type ?? null}::text)
      AND fe.date BETWEEN ${date_from}::date AND ${date_to}::date
      AND (${company_id ?? null}::uuid IS NULL OR pr.company_id = ${company_id ?? null}::uuid)

            UNION ALL

            SELECT
              fc.id,
              'expense'           AS type,
              'fixed_cost'        AS source_type,
              fc.id               AS source_id,
              fc.amount::float,
              LEAST(
                make_date(EXTRACT(year FROM gs)::int, EXTRACT(month FROM gs)::int, fc.due_day),
                (date_trunc('month', gs) + interval '1 month' - interval '1 day')::date
              )                   AS date,
              fc.name             AS description,
              fc.created_at
            FROM fixed_costs fc
            CROSS JOIN LATERAL generate_series(
              date_trunc('month', GREATEST(fc.start_date, ${date_from}::date)),
              date_trunc('month', LEAST(COALESCE(fc.end_date, ${date_to}::date), ${date_to}::date)),
              '1 month'::interval
            ) AS gs
            WHERE fc.active = true
              AND fc.start_date <= ${date_to}::date
              AND COALESCE(fc.end_date, ${date_to}::date) >= ${date_from}::date
      AND (${type ?? null}::text IS NULL OR 'expense' = ${type ?? null}::text)
      AND (${company_id ?? null}::uuid IS NULL OR fc.company_id = ${company_id ?? null}::uuid)

      UNION ALL

            SELECT
              vc.id,
              'expense'           AS type,
              'variable_cost'     AS source_type,
              vc.id               AS source_id,
              vc.amount::float,
              vc.date,
              COALESCE(vc.description, vc.name) AS description,
              vc.created_at
            FROM variable_costs vc
            WHERE vc.date BETWEEN ${date_from}::date AND ${date_to}::date
      AND (${type ?? null}::text IS NULL OR 'expense' = ${type ?? null}::text)
      AND (${company_id ?? null}::uuid IS NULL OR vc.company_id = ${company_id ?? null}::uuid)
    ) combined
          ORDER BY date DESC
          LIMIT ${limit} OFFSET ${offset}
        `
    : await sql`
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM financial_entries fe
      LEFT JOIN payments p ON p.id = fe.source_id AND fe.source_type = 'payment'
      LEFT JOIN projects pr ON pr.id = p.project_id
      WHERE
      (${type ?? null}::text IS NULL OR fe.type::text = ${type ?? null}::text)
      AND (
        ${company_id ?? null}::uuid IS NULL
        OR (fe.source_type = 'payment' AND pr.company_id = ${company_id ?? null}::uuid)
        OR (fe.source_type != 'payment')
      )
      ORDER BY fe.date DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { entries: rows.map(toFinancialEntry), total }
  },

  async getReport(params: { date_from: string; date_to: string; company_id?: string }): Promise<FinancialReport> {
    const { date_from, date_to, company_id } = params

    const [summary] = await sql`
      WITH all_entries AS (
      SELECT fe.type::text, fe.amount FROM financial_entries fe
      JOIN payments p ON p.id = fe.source_id AND fe.source_type = 'payment'
      JOIN projects pr ON pr.id = p.project_id
      WHERE fe.date BETWEEN ${date_from}::date AND ${date_to}::date
      AND (${company_id ?? null}::uuid IS NULL OR pr.company_id = ${company_id ?? null}::uuid)
      UNION ALL
      SELECT 'expense' AS type, fc.amount
      FROM fixed_costs fc
      CROSS JOIN LATERAL generate_series(
        date_trunc('month', GREATEST(fc.start_date, ${date_from}::date)),
        date_trunc('month', LEAST(COALESCE(fc.end_date, ${date_to}::date), ${date_to}::date)),
        '1 month'::interval
      ) AS gs
      WHERE fc.active = true
      AND fc.start_date <= ${date_to}::date
      AND COALESCE(fc.end_date, ${date_to}::date) >= ${date_from}::date
      AND (${company_id ?? null}::uuid IS NULL OR fc.company_id = ${company_id ?? null}::uuid)
      UNION ALL
      SELECT 'expense' AS type, vc.amount
      FROM variable_costs vc
      WHERE vc.date BETWEEN ${date_from}::date AND ${date_to}::date
      AND (${company_id ?? null}::uuid IS NULL OR vc.company_id = ${company_id ?? null}::uuid)
    )
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float AS total_income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float AS total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::float AS balance
      FROM all_entries
    `

    const monthRows = await sql`
      WITH all_entries AS (
      SELECT fe.type::text, fe.amount, fe.date FROM financial_entries fe
      JOIN payments p ON p.id = fe.source_id AND fe.source_type = 'payment'
      JOIN projects pr ON pr.id = p.project_id
      WHERE fe.date BETWEEN ${date_from}::date AND ${date_to}::date
      AND (${company_id ?? null}::uuid IS NULL OR pr.company_id = ${company_id ?? null}::uuid)
      UNION ALL
      SELECT
        'expense' AS type,
        fc.amount,
        LEAST(
          make_date(EXTRACT(year FROM gs)::int, EXTRACT(month FROM gs)::int, fc.due_day),
          (date_trunc('month', gs) + interval '1 month' - interval '1 day')::date
        ) AS date
      FROM fixed_costs fc
      CROSS JOIN LATERAL generate_series(
        date_trunc('month', GREATEST(fc.start_date, ${date_from}::date)),
        date_trunc('month', LEAST(COALESCE(fc.end_date, ${date_to}::date), ${date_to}::date)),
        '1 month'::interval
      ) AS gs
      WHERE fc.active = true
      AND fc.start_date <= ${date_to}::date
      AND COALESCE(fc.end_date, ${date_to}::date) >= ${date_from}::date
      AND (${company_id ?? null}::uuid IS NULL OR fc.company_id = ${company_id ?? null}::uuid)
      UNION ALL
      SELECT
        'expense' AS type,
        vc.amount,
        vc.date
      FROM variable_costs vc
      WHERE vc.date BETWEEN ${date_from}::date AND ${date_to}::date
      AND (${company_id ?? null}::uuid IS NULL OR vc.company_id = ${company_id ?? null}::uuid)
      )
      SELECT
        date_trunc('month', date)::date::text AS month,
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float  AS income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float AS expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::float AS balance
      FROM all_entries
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
