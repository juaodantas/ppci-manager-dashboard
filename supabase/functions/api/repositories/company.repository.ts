import sql from '../db.ts'
import { Company, CompanyType } from '../../_shared/domain/entities/company.entity.ts'
import { conflict } from '../errors.ts'

// deno-lint-ignore no-explicit-any
function toCompany(row: Record<string, any>): Company {
  return {
    id: row.id as string,
    name: row.name as string,
    cnpj: row.cnpj as string,
    responsible: row.responsible as string,
    type: row.type as CompanyType,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export interface CreateCompanyData {
  name: string
  cnpj: string
  responsible: string
  type: CompanyType
}

export interface UpdateCompanyData {
  name?: string
  cnpj?: string
  responsible?: string
  type?: CompanyType
}

export const CompanyRepository = {
  async findAll(params: { type?: CompanyType; limit: number; offset: number }): Promise<{ companies: Company[]; total: number }> {
    const { type, limit, offset } = params
    const rows = type
      ? await sql`
        SELECT *, COUNT(*) OVER()::int AS total_count
        FROM companies
        WHERE type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      : await sql`
        SELECT *, COUNT(*) OVER()::int AS total_count
        FROM companies
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { companies: rows.map(toCompany), total }
  },

  async findById(id: string): Promise<Company | null> {
    const rows = await sql`
      SELECT * FROM companies WHERE id = ${id}
    `
    return rows.length > 0 ? toCompany(rows[0]) : null
  },

  async save(data: CreateCompanyData): Promise<Company> {
    try {
      const rows = await sql`
        INSERT INTO companies (id, name, cnpj, responsible, type, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${data.name},
          ${data.cnpj},
          ${data.responsible},
          ${data.type},
          NOW(),
          NOW()
        )
        RETURNING *
      `
      return toCompany(rows[0])
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw conflict('CNPJ já cadastrado')
      }
      throw err
    }
  },

  async update(id: string, data: UpdateCompanyData): Promise<Company | null> {
    try {
      const rows = await sql`
        UPDATE companies
        SET
          name = COALESCE(${data.name ?? null}, name),
          cnpj = COALESCE(${data.cnpj ?? null}, cnpj),
          responsible = COALESCE(${data.responsible ?? null}, responsible),
          type = COALESCE(${data.type ?? null}, type),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return rows.length > 0 ? toCompany(rows[0]) : null
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw conflict('CNPJ já cadastrado')
      }
      throw err
    }
  },

  async delete(id: string): Promise<void> {
    const tables = ['projects', 'quotes', 'fixed_costs', 'variable_costs'] as const
    for (const table of tables) {
      const rows = await sql`
        SELECT 1 FROM ${sql(table)} WHERE company_id = ${id} LIMIT 1
      `
      if (rows.length > 0) {
        throw conflict('Cannot delete company with existing references')
      }
    }
    await sql`DELETE FROM companies WHERE id = ${id}`
  },
}

function isUniqueViolation(err: unknown): err is { code: string } {
  if (!err || typeof err !== 'object') return false
  return 'code' in err && typeof (err as { code?: string }).code === 'string' && (err as { code?: string }).code === '23505'
}
