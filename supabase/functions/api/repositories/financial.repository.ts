import sql from '../db.ts'
import { FinancialAnalytics, FinancialEntry, FinancialReport } from '../../_shared/domain/entities/financial-entry.entity.ts'
import { gatewayTimeout } from '../errors.ts'
import {
  addMonths,
  average,
  buildHistoricalBase,
  formatMonth,
  listMonths,
  monthStart,
  percentageMonthOverMonth,
  resolveTrendValues,
  type HistoricalSourceRow,
} from './financial-analytics.logic.ts'

type FinancialEntryRow = {
  id: string
  type: FinancialEntry['type']
  source_type: FinancialEntry['source_type']
  source_id: string
  amount: number
  date: string
  description: string | null
  created_at: string
  total_count?: number
}

type FinancialSummaryRow = {
  total_income: number
  total_expense: number
  balance: number
}

type FinancialMonthRow = {
  month: string
  income: number
  expense: number
  balance: number
}

type ForecastIncomeRow = {
  month: string
  pending_income: number
}

type ForecastFixedExpenseRow = {
  month: string
  fixed_expense: number
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, action: string): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer)
      reject(gatewayTimeout(`Database timeout while ${action}`))
    }, timeoutMs)
  })
  return await Promise.race([promise, timeoutPromise])
}

function toFinancialEntry(row: FinancialEntryRow): FinancialEntry {
  return {
    id: row.id,
    type: row.type,
    source_type: row.source_type,
    source_id: row.source_id,
    amount: row.amount,
    date: row.date,
    description: row.description,
    created_at: row.created_at,
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
              (fc.amount + COALESCE(fci.interest_amount, 0))::float,
              make_date(
                EXTRACT(year FROM gs)::int,
                EXTRACT(month FROM gs)::int,
                LEAST(fc.due_day::int, EXTRACT(day FROM (date_trunc('month', gs) + interval '1 month' - interval '1 day'))::int)
              )                   AS date,
              fc.name             AS description,
              fc.created_at
            FROM fixed_costs fc
            CROSS JOIN LATERAL generate_series(
              date_trunc('month', GREATEST(fc.start_date, ${date_from}::date)),
              date_trunc('month', LEAST(COALESCE(fc.end_date, ${date_to}::date), ${date_to}::date)),
              '1 month'::interval
            ) AS gs
            LEFT JOIN fixed_cost_interests fci
              ON fci.fixed_cost_id = fc.id
              AND fci.reference_year = EXTRACT(year FROM gs)::int
              AND fci.reference_month = EXTRACT(month FROM gs)::int
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
              (vc.amount + COALESCE(vc.interest_amount, 0))::float,
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

    const typedRows = rows as FinancialEntryRow[]
    const total = typedRows.length > 0 ? (typedRows[0].total_count ?? 0) : 0
    return { entries: typedRows.map(toFinancialEntry), total }
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
      SELECT 'expense' AS type, (fc.amount + COALESCE(fci.interest_amount, 0))::float AS amount
      FROM fixed_costs fc
      CROSS JOIN LATERAL generate_series(
        date_trunc('month', GREATEST(fc.start_date, ${date_from}::date)),
        date_trunc('month', LEAST(COALESCE(fc.end_date, ${date_to}::date), ${date_to}::date)),
        '1 month'::interval
      ) AS gs
      LEFT JOIN fixed_cost_interests fci
        ON fci.fixed_cost_id = fc.id
        AND fci.reference_year = EXTRACT(year FROM gs)::int
        AND fci.reference_month = EXTRACT(month FROM gs)::int
      WHERE fc.active = true
      AND fc.start_date <= ${date_to}::date
      AND COALESCE(fc.end_date, ${date_to}::date) >= ${date_from}::date
      AND (${company_id ?? null}::uuid IS NULL OR fc.company_id = ${company_id ?? null}::uuid)
      UNION ALL
      SELECT 'expense' AS type, (vc.amount + COALESCE(vc.interest_amount, 0))::float AS amount
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
        (fc.amount + COALESCE(fci.interest_amount, 0))::float AS amount,
        make_date(
          EXTRACT(year FROM gs)::int,
          EXTRACT(month FROM gs)::int,
          LEAST(fc.due_day::int, EXTRACT(day FROM (date_trunc('month', gs) + interval '1 month' - interval '1 day'))::int)
        ) AS date
      FROM fixed_costs fc
      CROSS JOIN LATERAL generate_series(
        date_trunc('month', GREATEST(fc.start_date, ${date_from}::date)),
        date_trunc('month', LEAST(COALESCE(fc.end_date, ${date_to}::date), ${date_to}::date)),
        '1 month'::interval
      ) AS gs
      LEFT JOIN fixed_cost_interests fci
        ON fci.fixed_cost_id = fc.id
        AND fci.reference_year = EXTRACT(year FROM gs)::int
        AND fci.reference_month = EXTRACT(month FROM gs)::int
      WHERE fc.active = true
      AND fc.start_date <= ${date_to}::date
      AND COALESCE(fc.end_date, ${date_to}::date) >= ${date_from}::date
      AND (${company_id ?? null}::uuid IS NULL OR fc.company_id = ${company_id ?? null}::uuid)
      UNION ALL
      SELECT
        'expense' AS type,
        (vc.amount + COALESCE(vc.interest_amount, 0))::float AS amount,
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
      total_income: (summary as FinancialSummaryRow).total_income,
      total_expense: (summary as FinancialSummaryRow).total_expense,
      balance: (summary as FinancialSummaryRow).balance,
      entries_by_month: (monthRows as FinancialMonthRow[]).map((r) => ({
        month: r.month,
        income: r.income,
        expense: r.expense,
        balance: r.balance,
      })),
    }
  },

  async getAnalytics(params: {
    company_id?: string
    date_from: string
    date_to: string
    horizon_months: number
  }): Promise<FinancialAnalytics> {
    const { company_id, date_from, date_to, horizon_months } = params
    const queryTimeoutMs = 4_000

    const [historicalRows, pendingIncomeRows, forecastFixedExpenseRows] = await Promise.all([
      withTimeout(sql`
        WITH payment_income_by_month AS (
          SELECT
            date_trunc('month', fe.date)::date::text AS month,
            COALESCE(SUM(fe.amount), 0)::float AS income
          FROM financial_entries fe
          JOIN payments p ON p.id = fe.source_id AND fe.source_type = 'payment'
          JOIN projects pr ON pr.id = p.project_id
          WHERE fe.type = 'income'
            AND (${company_id ?? null}::uuid IS NULL OR pr.company_id = ${company_id ?? null}::uuid)
            AND fe.date BETWEEN ${date_from}::date AND ${date_to}::date
          GROUP BY date_trunc('month', fe.date)
        ),
        fixed_cost_by_month AS (
          SELECT
            date_trunc('month', make_date(
              EXTRACT(year FROM gs)::int,
              EXTRACT(month FROM gs)::int,
              LEAST(fc.due_day::int, EXTRACT(day FROM (date_trunc('month', gs) + interval '1 month' - interval '1 day'))::int)
            ))::date::text AS month,
            COALESCE(SUM(fc.amount + COALESCE(fci.interest_amount, 0)), 0)::float AS fixed_expense
          FROM fixed_costs fc
          CROSS JOIN LATERAL generate_series(
            date_trunc('month', GREATEST(fc.start_date, ${date_from}::date)),
            date_trunc('month', LEAST(COALESCE(fc.end_date, ${date_to}::date), ${date_to}::date)),
            '1 month'::interval
          ) AS gs
          LEFT JOIN fixed_cost_interests fci
            ON fci.fixed_cost_id = fc.id
            AND fci.reference_year = EXTRACT(year FROM gs)::int
            AND fci.reference_month = EXTRACT(month FROM gs)::int
          WHERE fc.active = true
            AND fc.start_date <= ${date_to}::date
            AND COALESCE(fc.end_date, ${date_to}::date) >= ${date_from}::date
            AND (${company_id ?? null}::uuid IS NULL OR fc.company_id = ${company_id ?? null}::uuid)
          GROUP BY date_trunc('month', make_date(
            EXTRACT(year FROM gs)::int,
            EXTRACT(month FROM gs)::int,
            LEAST(fc.due_day::int, EXTRACT(day FROM (date_trunc('month', gs) + interval '1 month' - interval '1 day'))::int)
          ))
        ),
        variable_cost_by_month AS (
          SELECT
            date_trunc('month', vc.date)::date::text AS month,
            COALESCE(SUM(vc.amount + COALESCE(vc.interest_amount, 0)), 0)::float AS variable_expense
          FROM variable_costs vc
          WHERE (${company_id ?? null}::uuid IS NULL OR vc.company_id = ${company_id ?? null}::uuid)
            AND vc.date BETWEEN ${date_from}::date AND ${date_to}::date
          GROUP BY date_trunc('month', vc.date)
        )
        SELECT
          month,
          income,
          fixed_expense,
          variable_expense
        FROM (
          SELECT month, income, 0::float AS fixed_expense, 0::float AS variable_expense FROM payment_income_by_month
          UNION ALL
          SELECT month, 0::float AS income, fixed_expense, 0::float AS variable_expense FROM fixed_cost_by_month
          UNION ALL
          SELECT month, 0::float AS income, 0::float AS fixed_expense, variable_expense FROM variable_cost_by_month
        ) by_source
      ` as Promise<HistoricalSourceRow[]>, queryTimeoutMs, 'loading historical analytics'),
      withTimeout(sql`
        SELECT
          date_trunc('month', p.due_date)::date::text AS month,
          COALESCE(SUM(p.amount), 0)::float AS pending_income
        FROM payments p
        JOIN projects pr ON pr.id = p.project_id
        WHERE (${company_id ?? null}::uuid IS NULL OR pr.company_id = ${company_id ?? null}::uuid)
          AND p.status = 'pending'
          AND p.due_date IS NOT NULL
          AND p.due_date >= date_trunc('month', ${date_to}::date + interval '1 month')::date
          AND p.due_date < date_trunc('month', ${date_to}::date + (${horizon_months}::int + 1) * interval '1 month')::date
        GROUP BY date_trunc('month', p.due_date)
      ` as Promise<ForecastIncomeRow[]>, queryTimeoutMs, 'loading pending forecast income'),
      withTimeout(sql`
        SELECT
          date_trunc('month', make_date(
            EXTRACT(year FROM gs)::int,
            EXTRACT(month FROM gs)::int,
            LEAST(fc.due_day::int, EXTRACT(day FROM (date_trunc('month', gs) + interval '1 month' - interval '1 day'))::int)
          ))::date::text AS month,
          COALESCE(SUM(fc.amount + COALESCE(fci.interest_amount, 0)), 0)::float AS fixed_expense
        FROM fixed_costs fc
        CROSS JOIN LATERAL generate_series(
          date_trunc('month', ${date_to}::date + interval '1 month'),
          date_trunc('month', ${date_to}::date + ${horizon_months}::int * interval '1 month'),
          '1 month'::interval
        ) AS gs
        LEFT JOIN fixed_cost_interests fci
          ON fci.fixed_cost_id = fc.id
          AND fci.reference_year = EXTRACT(year FROM gs)::int
          AND fci.reference_month = EXTRACT(month FROM gs)::int
        WHERE fc.active = true
          AND (${company_id ?? null}::uuid IS NULL OR fc.company_id = ${company_id ?? null}::uuid)
          AND fc.start_date <= (date_trunc('month', gs) + interval '1 month' - interval '1 day')::date
          AND COALESCE(fc.end_date, (date_trunc('month', gs) + interval '1 month' - interval '1 day')::date) >= date_trunc('month', gs)::date
        GROUP BY date_trunc('month', make_date(
          EXTRACT(year FROM gs)::int,
          EXTRACT(month FROM gs)::int,
          LEAST(fc.due_day::int, EXTRACT(day FROM (date_trunc('month', gs) + interval '1 month' - interval '1 day'))::int)
        ))
      ` as Promise<ForecastFixedExpenseRow[]>, queryTimeoutMs, 'loading fixed expense forecast')
    ])

    const periodMonths = listMonths(date_from, date_to)
    const historicalBase = buildHistoricalBase(periodMonths, historicalRows)

    const historical_by_month = historicalBase.map((current, index) => {
      const previous = index > 0 ? historicalBase[index - 1] : null
      return {
        month: current.month,
        income: current.income,
        expense: current.expense,
        balance: current.balance,
        mom_income_pct: previous ? percentageMonthOverMonth(current.income, previous.income) : null,
        mom_expense_pct: previous ? percentageMonthOverMonth(current.expense, previous.expense) : null,
        mom_balance_pct: previous ? percentageMonthOverMonth(current.balance, previous.balance) : null,
      }
    })

    const expense_composition_by_month = historicalBase.map((current) => {
      const totalExpense = current.expense
      if (totalExpense === 0) {
        return {
          month: current.month,
          fixed_expense: current.fixed_expense,
          variable_expense: current.variable_expense,
          fixed_share_pct: 0,
          variable_share_pct: 0,
        }
      }

      return {
        month: current.month,
        fixed_expense: current.fixed_expense,
        variable_expense: current.variable_expense,
        fixed_share_pct: (current.fixed_expense / totalExpense) * 100,
        variable_share_pct: (current.variable_expense / totalExpense) * 100,
      }
    })

    const { trendIncome, trendVariableExpense } = resolveTrendValues(historicalBase)

    const pendingIncomeByMonth = new Map<string, number>()
    for (const row of pendingIncomeRows) {
      pendingIncomeByMonth.set(row.month.slice(0, 10), row.pending_income)
    }

    const fixedExpenseByMonth = new Map<string, number>()
    for (const row of forecastFixedExpenseRows) {
      fixedExpenseByMonth.set(row.month.slice(0, 10), row.fixed_expense)
    }

    const forecastMonths = Array.from({ length: horizon_months }, (_, index) =>
      formatMonth(addMonths(monthStart(date_to), index + 1)),
    )

    const forecast_by_month = forecastMonths.map((month) => {
      const pendingIncome = pendingIncomeByMonth.get(month) ?? 0
      const forecast_income = pendingIncome + trendIncome
      const fixedExpense = fixedExpenseByMonth.get(month) ?? 0
      const forecast_expense = fixedExpense + trendVariableExpense
      const forecast_balance = forecast_income - forecast_expense

      return {
        month,
        forecast_income,
        forecast_expense,
        forecast_balance,
        is_negative_balance: forecast_balance < 0,
      }
    })

    return {
      historical_by_month,
      expense_composition_by_month,
      forecast_by_month,
    }
  },
}
