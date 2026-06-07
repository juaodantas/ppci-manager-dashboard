import { FixedCostInterest } from '../../_shared/domain/entities/fixed-cost.entity.ts'
import { conflict } from '../errors.ts'
import sql from '../db.ts'

type FixedCostInterestRow = {
  id: string
  fixed_cost_id: string
  reference_year: number
  reference_month: number
  interest_amount: number
  created_at: string
  updated_at: string
}

function toFixedCostInterest(row: FixedCostInterestRow): FixedCostInterest {
  return {
    id: row.id,
    fixed_cost_id: row.fixed_cost_id,
    reference_year: row.reference_year,
    reference_month: row.reference_month,
    interest_amount: row.interest_amount,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function isUniqueViolation(err: unknown): err is { code: string } {
  if (!err || typeof err !== 'object') return false
  return 'code' in err && typeof (err as { code?: string }).code === 'string' && (err as { code?: string }).code === '23505'
}

export const FixedCostInterestRepository = {
  async findAllByFixedCost(fixedCostId: string, referenceYear?: number): Promise<FixedCostInterest[]> {
    const rows = referenceYear
      ? await sql`
        SELECT *
        FROM fixed_cost_interests
        WHERE fixed_cost_id = ${fixedCostId}
          AND reference_year = ${referenceYear}
        ORDER BY reference_year DESC, reference_month DESC
      `
      : await sql`
        SELECT *
        FROM fixed_cost_interests
        WHERE fixed_cost_id = ${fixedCostId}
        ORDER BY reference_year DESC, reference_month DESC
      `
    return (rows as FixedCostInterestRow[]).map(toFixedCostInterest)
  },

  async create(data: {
    fixed_cost_id: string
    reference_year: number
    reference_month: number
    interest_amount: number
  }): Promise<FixedCostInterest> {
    try {
      const rows = await sql`
        INSERT INTO fixed_cost_interests (fixed_cost_id, reference_year, reference_month, interest_amount)
        VALUES (${data.fixed_cost_id}, ${data.reference_year}, ${data.reference_month}, ${data.interest_amount})
        RETURNING *
      `
      return toFixedCostInterest(rows[0] as FixedCostInterestRow)
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw conflict('Já existe juros cadastrado para este mês neste custo fixo')
      }
      throw err
    }
  },

  async update(
    fixedCostId: string,
    interestId: string,
    data: {
      reference_year: number
      reference_month: number
      interest_amount: number
    },
  ): Promise<FixedCostInterest | null> {
    try {
      const rows = await sql`
        UPDATE fixed_cost_interests
        SET
          reference_year = ${data.reference_year},
          reference_month = ${data.reference_month},
          interest_amount = ${data.interest_amount},
          updated_at = now()
        WHERE id = ${interestId}
          AND fixed_cost_id = ${fixedCostId}
        RETURNING *
      `
      return rows.length > 0 ? toFixedCostInterest(rows[0] as FixedCostInterestRow) : null
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw conflict('Já existe juros cadastrado para este mês neste custo fixo')
      }
      throw err
    }
  },

  async delete(fixedCostId: string, interestId: string): Promise<boolean> {
    const rows = await sql`
      DELETE FROM fixed_cost_interests
      WHERE id = ${interestId}
        AND fixed_cost_id = ${fixedCostId}
      RETURNING id
    `
    return rows.length > 0
  },
}
