import sql from '../db.ts'
import type { FixedCost, FixedCostMonth, FixedCostMonthlyEntry, FixedCostMonthlyLine, FixedCostMonthStatus } from '../../_shared/domain/index.ts'

type FixedCostMonthRow = {
  id: string
  reference_year: number
  reference_month: number
  company_id: string | null
  status: FixedCostMonthStatus
  confirmed_at: string | null
  closed_at: string | null
}

type FixedCostMonthlyEntryRow = FixedCostMonthlyEntry

function normalizeMonthStatus(status: FixedCostMonthStatus): Exclude<FixedCostMonthStatus, 'open'> {
  return status === 'closed' ? 'closed' : 'confirmed'
}

function toMonth(row: FixedCostMonthRow): FixedCostMonth {
  return {
    id: row.id,
    reference_year: row.reference_year,
    reference_month: row.reference_month,
    company_id: row.company_id,
    status: normalizeMonthStatus(row.status),
    confirmed_at: row.confirmed_at,
    closed_at: row.closed_at,
  }
}

function openMonth(referenceYear: number, referenceMonth: number, companyId?: string): FixedCostMonth {
  return {
    id: null,
    reference_year: referenceYear,
    reference_month: referenceMonth,
    company_id: companyId ?? null,
    status: 'confirmed',
    confirmed_at: null,
    closed_at: null,
  }
}

export const FixedCostMonthRepository = {
  async findMonth(params: {
    referenceYear: number
    referenceMonth: number
    companyId?: string
  }): Promise<FixedCostMonth> {
    const rows = await sql`
      SELECT id, reference_year, reference_month, company_id, status, confirmed_at, closed_at
      FROM fixed_cost_months
      WHERE reference_year = ${params.referenceYear}
        AND reference_month = ${params.referenceMonth}
        AND (
          (${params.companyId ?? null}::uuid IS NULL AND company_id IS NULL)
          OR (
            ${params.companyId ?? null}::uuid IS NOT NULL
            AND (
              company_id = ${params.companyId ?? null}::uuid
              OR company_id IS NULL
            )
          )
        )
      ORDER BY CASE
        WHEN ${params.companyId ?? null}::uuid IS NOT NULL
          AND company_id = ${params.companyId ?? null}::uuid THEN 0
        WHEN company_id IS NULL THEN 1
        ELSE 2
      END
      LIMIT 1
    `
    return rows.length > 0 ? toMonth(rows[0] as FixedCostMonthRow) : openMonth(params.referenceYear, params.referenceMonth, params.companyId)
  },

  async findEntry(params: {
    fixedCostId: string
    referenceYear: number
    referenceMonth: number
  }): Promise<FixedCostMonthlyEntry | null> {
    const rows = await sql`
      SELECT *
      FROM fixed_cost_monthly_entries
      WHERE fixed_cost_id = ${params.fixedCostId}
        AND reference_year = ${params.referenceYear}
        AND reference_month = ${params.referenceMonth}
      LIMIT 1
    `
    return rows.length > 0 ? rows[0] as FixedCostMonthlyEntryRow : null
  },

  async hasClosedMonth(params: {
    referenceYear: number
    referenceMonth: number
    companyId?: string | null
  }): Promise<boolean> {
    const rows = await sql`
      SELECT status
      FROM fixed_cost_months
      WHERE reference_year = ${params.referenceYear}
        AND reference_month = ${params.referenceMonth}
        AND (
          (${params.companyId ?? null}::uuid IS NULL AND company_id IS NULL)
          OR (
            ${params.companyId ?? null}::uuid IS NOT NULL
            AND (
              company_id = ${params.companyId ?? null}::uuid
              OR company_id IS NULL
            )
          )
        )
      ORDER BY CASE
        WHEN ${params.companyId ?? null}::uuid IS NOT NULL
          AND company_id = ${params.companyId ?? null}::uuid THEN 0
        WHEN company_id IS NULL THEN 1
        ELSE 2
      END
      LIMIT 1
    `
    return rows.length > 0 && (rows[0] as FixedCostMonthRow).status === 'closed'
  },

  async upsertEntry(data: {
    fixedCost: FixedCost
    referenceYear: number
    referenceMonth: number
    amount: number
    interestAmount: number
    dueDay: number
    name: string
    category: string | null
    included: boolean
  }): Promise<FixedCostMonthlyEntry> {
    const rows = await sql`
      INSERT INTO fixed_cost_monthly_entries (
        fixed_cost_id,
        reference_year,
        reference_month,
        amount,
        interest_amount,
        due_day,
        name,
        category,
        company_id,
        included,
        status
      )
      VALUES (
        ${data.fixedCost.id},
        ${data.referenceYear},
        ${data.referenceMonth},
        ${data.amount},
        ${data.interestAmount},
        ${data.dueDay},
        ${data.name},
        ${data.category},
        ${data.fixedCost.company_id ?? null},
        ${data.included},
        'edited'
      )
      ON CONFLICT (fixed_cost_id, reference_year, reference_month)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        interest_amount = EXCLUDED.interest_amount,
        due_day = EXCLUDED.due_day,
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        company_id = EXCLUDED.company_id,
        included = EXCLUDED.included,
        status = CASE
          WHEN fixed_cost_monthly_entries.status = 'closed' THEN fixed_cost_monthly_entries.status
          ELSE 'edited'
        END,
        updated_at = now()
      RETURNING *
    `
    return rows[0] as FixedCostMonthlyEntryRow
  },

  async materializeMonth(params: {
    referenceYear: number
    referenceMonth: number
    companyId?: string
    status: Exclude<FixedCostMonthStatus, 'open'>
    lines: FixedCostMonthlyLine[]
  }): Promise<void> {
    await sql.begin(async (tx) => {
      if (params.companyId) {
        await tx`
          INSERT INTO fixed_cost_months (reference_year, reference_month, company_id, status, confirmed_at, closed_at)
          VALUES (
            ${params.referenceYear},
            ${params.referenceMonth},
            ${params.companyId}::uuid,
            ${params.status},
            now(),
            ${params.status === 'closed' ? sql`now()` : null}
          )
          ON CONFLICT ON CONSTRAINT "UQ_fixed_cost_months_competence"
          DO UPDATE SET
            status = CASE
              WHEN fixed_cost_months.status = 'closed' THEN 'closed'
              ELSE EXCLUDED.status
            END,
            confirmed_at = COALESCE(fixed_cost_months.confirmed_at, now()),
            closed_at = CASE WHEN EXCLUDED.status = 'closed' THEN COALESCE(fixed_cost_months.closed_at, now()) ELSE fixed_cost_months.closed_at END,
            updated_at = now()
        `
      } else {
        await tx`
          INSERT INTO fixed_cost_months (reference_year, reference_month, company_id, status, confirmed_at, closed_at)
          VALUES (
            ${params.referenceYear},
            ${params.referenceMonth},
            NULL,
            ${params.status},
            now(),
            ${params.status === 'closed' ? sql`now()` : null}
          )
          ON CONFLICT (reference_year, reference_month) WHERE company_id IS NULL
          DO UPDATE SET
            status = CASE
              WHEN fixed_cost_months.status = 'closed' THEN 'closed'
              ELSE EXCLUDED.status
            END,
            confirmed_at = COALESCE(fixed_cost_months.confirmed_at, now()),
            closed_at = CASE WHEN EXCLUDED.status = 'closed' THEN COALESCE(fixed_cost_months.closed_at, now()) ELSE fixed_cost_months.closed_at END,
            updated_at = now()
        `
      }

      for (const line of params.lines) {
        await tx`
          INSERT INTO fixed_cost_monthly_entries (
            fixed_cost_id,
            reference_year,
            reference_month,
            amount,
            interest_amount,
            due_day,
            name,
            category,
            company_id,
            included,
            status,
            confirmed_at,
            closed_at
          )
          VALUES (
            ${line.fixed_cost_id},
            ${params.referenceYear},
            ${params.referenceMonth},
            ${line.monthly_base_amount},
            ${line.interest_amount},
            ${line.due_day},
            ${line.name},
            ${line.category},
            ${line.company_id},
            ${line.included},
            ${params.status},
            now(),
            ${params.status === 'closed' ? sql`now()` : null}
          )
          ON CONFLICT (fixed_cost_id, reference_year, reference_month)
          DO UPDATE SET
            status = CASE
              WHEN fixed_cost_monthly_entries.status = 'closed' THEN 'closed'
              ELSE EXCLUDED.status
            END,
            confirmed_at = COALESCE(fixed_cost_monthly_entries.confirmed_at, now()),
            closed_at = CASE WHEN EXCLUDED.status = 'closed' THEN COALESCE(fixed_cost_monthly_entries.closed_at, now()) ELSE fixed_cost_monthly_entries.closed_at END,
            updated_at = now()
        `
      }
    })
  },
}
