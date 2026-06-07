import sql from '../db.ts'
import { getFixedCostMonthActivity } from '../fixed-cost-month-activity.ts'
import type {
  FixedCostMonth,
  FixedCostMonthResolution,
  FixedCostMonthlyLine,
  FixedCostMonthlyLineStatus,
} from '../../_shared/domain/index.ts'
import { FixedCostMonthRepository } from './fixed-cost-month.repository.ts'

type ResolvedFixedCostMonthlyRow = {
  fixed_cost_id: string
  fixed_cost_name: string
  fixed_cost_category: string | null
  fixed_cost_company_id: string | null
  fixed_cost_due_day: number
  fixed_cost_amount: number
  fixed_cost_active: boolean
  fixed_cost_start_date: string
  fixed_cost_end_date: string | null
  monthly_entry_id: string | null
  monthly_name: string | null
  monthly_category: string | null
  monthly_company_id: string | null
  monthly_due_day: number | null
  monthly_amount: number | null
  monthly_interest_amount: number | null
  monthly_included: boolean | null
  monthly_status: 'open' | 'predicted' | 'edited' | 'confirmed' | 'closed' | null
  interest_amount: number | null
  due_date: string
}

function toNumber(value: number | string | null): number {
  if (value === null) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeLineStatus(status: ResolvedFixedCostMonthlyRow['monthly_status']): FixedCostMonthlyLineStatus | null {
  if (status === null) return null
  if (status === 'closed' || status === 'edited') return status
  return 'confirmed'
}

function statusFor(row: ResolvedFixedCostMonthlyRow, month: FixedCostMonth): FixedCostMonthlyLineStatus {
  const normalizedMonthlyStatus = normalizeLineStatus(row.monthly_status)
  if (normalizedMonthlyStatus) return normalizedMonthlyStatus
  if (month.status === 'closed') return 'closed'
  return 'confirmed'
}

function editBlockFor(params: {
  month: FixedCostMonth
  hasMonthlyEntry: boolean
  fixedCostMonthActivity: ReturnType<typeof getFixedCostMonthActivity>
  lineStatus: FixedCostMonthlyLineStatus
}): Pick<FixedCostMonthlyLine, 'edit_block_reason' | 'edit_block_message'> {
  if (params.month.status === 'closed' || params.lineStatus === 'closed') {
    return {
      edit_block_reason: 'month_closed',
      edit_block_message: 'Este mês está fechado para edição comum.',
    }
  }

  if (!params.hasMonthlyEntry || params.fixedCostMonthActivity.isActiveForMonth) {
    return {
      edit_block_reason: undefined,
      edit_block_message: undefined,
    }
  }

  if (params.fixedCostMonthActivity.reason === 'inactive') {
    return {
      edit_block_reason: 'inactive',
      edit_block_message: 'Este custo está inativo no cadastro recorrente.',
    }
  }

  if (params.fixedCostMonthActivity.reason === 'before_start_date') {
    return {
      edit_block_reason: 'before_start_date',
      edit_block_message: 'Este custo começa depois do mês selecionado.',
    }
  }

  if (params.fixedCostMonthActivity.reason === 'after_end_date') {
    return {
      edit_block_reason: 'after_end_date',
      edit_block_message: 'Este custo terminou antes do mês selecionado.',
    }
  }

  return {
    edit_block_reason: undefined,
    edit_block_message: undefined,
  }
}

function toLine(row: ResolvedFixedCostMonthlyRow, month: FixedCostMonth): FixedCostMonthlyLine {
  const hasMonthlyEntry = row.monthly_entry_id !== null
  const baseAmount = toNumber(row.fixed_cost_amount)
  const interestAmount = hasMonthlyEntry ? toNumber(row.monthly_interest_amount) : toNumber(row.interest_amount)
  const amount = hasMonthlyEntry ? toNumber(row.monthly_amount) : baseAmount
  const included = row.monthly_included ?? true
  const monthlyAmount = included ? amount + interestAmount : 0
  const lineStatus = statusFor(row, month)
  const fixedCostMonthActivity = getFixedCostMonthActivity({
    active: row.fixed_cost_active,
    startDate: row.fixed_cost_start_date,
    endDate: row.fixed_cost_end_date,
    referenceYear: month.reference_year,
    referenceMonth: month.reference_month,
  })
  const activeForMonth = fixedCostMonthActivity.isActiveForMonth
  const snapshotOnly = hasMonthlyEntry && !activeForMonth
  const editBlock = editBlockFor({ month, hasMonthlyEntry, fixedCostMonthActivity, lineStatus })

  return {
    id: row.monthly_entry_id ?? `fixed-cost:${row.fixed_cost_id}:${month.reference_year}-${String(month.reference_month).padStart(2, '0')}`,
    fixed_cost_id: row.fixed_cost_id,
    monthly_entry_id: row.monthly_entry_id,
    name: row.monthly_name ?? row.fixed_cost_name,
    category: row.monthly_category ?? row.fixed_cost_category,
    company_id: row.monthly_company_id ?? row.fixed_cost_company_id,
    due_day: row.monthly_due_day ?? row.fixed_cost_due_day,
    due_date: row.due_date,
    base_amount: amount,
    recurring_base_amount: baseAmount,
    monthly_base_amount: amount,
    interest_amount: interestAmount,
    monthly_amount: monthlyAmount,
    included,
    source: hasMonthlyEntry ? 'monthly_entry' : 'dynamic_base',
    status: lineStatus,
    is_editable: editBlock.edit_block_reason === undefined,
    edit_block_reason: editBlock.edit_block_reason,
    edit_block_message: editBlock.edit_block_message,
    base_relation_status: activeForMonth ? 'active_for_month' : snapshotOnly ? 'snapshot_only' : 'inactive_for_month',
  }
}

function summarize(items: FixedCostMonthlyLine[]): FixedCostMonthResolution['summary'] {
  return items.reduce(
    (summary, item) => ({
      total_base_amount: summary.total_base_amount + item.base_amount,
      total_interest_amount: summary.total_interest_amount + item.interest_amount,
      total_monthly_amount: summary.total_monthly_amount + item.monthly_amount,
      predicted_count: summary.predicted_count,
      edited_count: summary.edited_count + (item.status === 'edited' ? 1 : 0),
      confirmed_count: summary.confirmed_count + (item.status === 'confirmed' ? 1 : 0),
      closed_count: summary.closed_count + (item.status === 'closed' ? 1 : 0),
    }),
    {
      total_base_amount: 0,
      total_interest_amount: 0,
      total_monthly_amount: 0,
      predicted_count: 0,
      edited_count: 0,
      confirmed_count: 0,
      closed_count: 0,
    },
  )
}

export const FixedCostMonthResolutionRepository = {
  async resolve(params: {
    referenceYear: number
    referenceMonth: number
    companyId?: string
  }): Promise<FixedCostMonthResolution> {
    const month = await FixedCostMonthRepository.findMonth(params)
    const rows = await sql`
      WITH competence AS (
        SELECT
          make_date(${params.referenceYear}, ${params.referenceMonth}, 1) AS month_start,
          (make_date(${params.referenceYear}, ${params.referenceMonth}, 1) + interval '1 month - 1 day')::date AS month_end
      ), active_costs AS (
        SELECT fc.*
        FROM fixed_costs fc, competence c
        WHERE fc.active = true
          AND (${params.companyId ?? null}::uuid IS NULL OR fc.company_id = ${params.companyId ?? null}::uuid)
          AND fc.start_date <= c.month_end
          AND COALESCE(fc.end_date, '9999-12-31'::date) >= c.month_start
      ), interests AS (
        SELECT fixed_cost_id, SUM(interest_amount) AS interest_amount
        FROM fixed_cost_interests
        WHERE reference_year = ${params.referenceYear}
          AND reference_month = ${params.referenceMonth}
        GROUP BY fixed_cost_id
      ), resolved_costs AS (
        SELECT
          fc.id AS fixed_cost_id,
          fc.name AS fixed_cost_name,
          fc.category AS fixed_cost_category,
          fc.company_id AS fixed_cost_company_id,
          fc.due_day AS fixed_cost_due_day,
          fc.amount AS fixed_cost_amount,
          fc.active AS fixed_cost_active,
          fc.start_date AS fixed_cost_start_date,
          fc.end_date AS fixed_cost_end_date,
          me.id AS monthly_entry_id,
          me.name AS monthly_name,
          me.category AS monthly_category,
          me.company_id AS monthly_company_id,
          me.due_day AS monthly_due_day,
          me.amount AS monthly_amount,
          me.interest_amount AS monthly_interest_amount,
          me.included AS monthly_included,
          me.status AS monthly_status,
          COALESCE(i.interest_amount, 0) AS interest_amount,
          (
            make_date(
              ${params.referenceYear},
              ${params.referenceMonth},
              LEAST(me.due_day, EXTRACT(day FROM c.month_end)::int)
            )
          )::text AS due_date
        FROM fixed_cost_monthly_entries me
        CROSS JOIN competence c
        INNER JOIN fixed_costs fc ON fc.id = me.fixed_cost_id
        LEFT JOIN interests i ON i.fixed_cost_id = fc.id
        WHERE me.reference_year = ${params.referenceYear}
          AND me.reference_month = ${params.referenceMonth}
          AND (${params.companyId ?? null}::uuid IS NULL OR me.company_id = ${params.companyId ?? null}::uuid)

        UNION ALL

        SELECT
          fc.id AS fixed_cost_id,
          fc.name AS fixed_cost_name,
          fc.category AS fixed_cost_category,
          fc.company_id AS fixed_cost_company_id,
          fc.due_day AS fixed_cost_due_day,
          fc.amount AS fixed_cost_amount,
          fc.active AS fixed_cost_active,
          fc.start_date AS fixed_cost_start_date,
          fc.end_date AS fixed_cost_end_date,
          NULL AS monthly_entry_id,
          NULL AS monthly_name,
          NULL AS monthly_category,
          NULL AS monthly_company_id,
          NULL AS monthly_due_day,
          NULL AS monthly_amount,
          NULL AS monthly_interest_amount,
          NULL AS monthly_included,
          NULL AS monthly_status,
          COALESCE(i.interest_amount, 0) AS interest_amount,
          (
            make_date(
              ${params.referenceYear},
              ${params.referenceMonth},
              LEAST(fc.due_day, EXTRACT(day FROM c.month_end)::int)
            )
          )::text AS due_date
        FROM active_costs fc
        CROSS JOIN competence c
        LEFT JOIN interests i ON i.fixed_cost_id = fc.id
        WHERE NOT EXISTS (
            SELECT 1
            FROM fixed_cost_monthly_entries me
            WHERE me.fixed_cost_id = fc.id
              AND me.reference_year = ${params.referenceYear}
              AND me.reference_month = ${params.referenceMonth}
          )
      )
      SELECT
        fixed_cost_id,
        fixed_cost_name,
        fixed_cost_category,
        fixed_cost_company_id,
        fixed_cost_due_day,
        fixed_cost_amount,
        fixed_cost_active,
        fixed_cost_start_date,
        fixed_cost_end_date,
        monthly_entry_id,
        monthly_name,
        monthly_category,
        monthly_company_id,
        monthly_due_day,
        monthly_amount,
        monthly_interest_amount,
        monthly_included,
        monthly_status,
        interest_amount,
        due_date
      FROM resolved_costs
      ORDER BY COALESCE(monthly_name, fixed_cost_name) ASC
    `
    const items = (rows as ResolvedFixedCostMonthlyRow[]).map((row) => toLine(row, month))
    return { month, items, summary: summarize(items) }
  },
}
