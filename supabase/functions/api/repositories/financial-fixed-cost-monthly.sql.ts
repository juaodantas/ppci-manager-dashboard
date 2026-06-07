import sql from '../db.ts'

type FixedCostMonthlyQueryParams = {
  date_from: string
  date_to: string
  company_id?: string
}

export function fixedCostMonthlyEntriesSql(params: FixedCostMonthlyQueryParams) {
  return sql`
    WITH months AS (
      SELECT gs AS month_start,
        (gs + interval '1 month' - interval '1 day')::date AS month_end,
        EXTRACT(year FROM gs)::int AS reference_year,
        EXTRACT(month FROM gs)::int AS reference_month
      FROM generate_series(
        date_trunc('month', ${params.date_from}::date),
        date_trunc('month', ${params.date_to}::date),
        '1 month'::interval
      ) AS gs
    ), interests AS (
      SELECT fixed_cost_id, reference_year, reference_month, SUM(interest_amount) AS interest_amount
      FROM fixed_cost_interests
      WHERE make_date(reference_year, reference_month, 1) BETWEEN date_trunc('month', ${params.date_from}::date)::date AND date_trunc('month', ${params.date_to}::date)::date
      GROUP BY fixed_cost_id, reference_year, reference_month
    ), monthly_entries AS (
      SELECT
        ('fixed-cost-monthly:' || me.id::text) AS id,
        'expense' AS type,
        'fixed_cost' AS source_type,
        me.fixed_cost_id::text AS source_id,
        (me.amount + me.interest_amount)::float AS amount,
        make_date(
          me.reference_year,
          me.reference_month,
          LEAST(me.due_day::int, EXTRACT(day FROM (make_date(me.reference_year, me.reference_month, 1) + interval '1 month' - interval '1 day'))::int)
        ) AS date,
        me.name AS description,
        me.created_at
      FROM fixed_cost_monthly_entries me
      WHERE me.included = true
        AND make_date(me.reference_year, me.reference_month, 1) BETWEEN date_trunc('month', ${params.date_from}::date)::date AND date_trunc('month', ${params.date_to}::date)::date
        AND (${params.company_id ?? null}::uuid IS NULL OR me.company_id = ${params.company_id ?? null}::uuid)
    ), dynamic_entries AS (
      SELECT
        ('fixed-cost:' || fc.id::text || ':' || m.reference_year::text || '-' || lpad(m.reference_month::text, 2, '0')) AS id,
        'expense' AS type,
        'fixed_cost' AS source_type,
        fc.id::text AS source_id,
        (fc.amount + COALESCE(i.interest_amount, 0))::float AS amount,
        make_date(
          m.reference_year,
          m.reference_month,
          LEAST(fc.due_day::int, EXTRACT(day FROM m.month_end)::int)
        ) AS date,
        fc.name AS description,
        fc.created_at
      FROM fixed_costs fc
      JOIN months m ON fc.start_date <= m.month_end
        AND COALESCE(fc.end_date, m.month_end) >= m.month_start::date
      LEFT JOIN interests i ON i.fixed_cost_id = fc.id
        AND i.reference_year = m.reference_year
        AND i.reference_month = m.reference_month
      WHERE fc.active = true
        AND (${params.company_id ?? null}::uuid IS NULL OR fc.company_id = ${params.company_id ?? null}::uuid)
        AND NOT EXISTS (
          SELECT 1
          FROM fixed_cost_monthly_entries me
          WHERE me.fixed_cost_id = fc.id
            AND me.reference_year = m.reference_year
            AND me.reference_month = m.reference_month
        )
    )
    SELECT id, type, source_type, source_id, amount, date, description, created_at FROM monthly_entries
    UNION ALL
    SELECT id, type, source_type, source_id, amount, date, description, created_at FROM dynamic_entries
  `
}
