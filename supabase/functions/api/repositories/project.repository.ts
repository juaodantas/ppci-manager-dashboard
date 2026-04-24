import sql from '../db.ts'
import { Project, ProjectService } from '../../_shared/domain/entities/project.entity.ts'

// deno-lint-ignore no-explicit-any
function toProjectService(row: Record<string, any>): ProjectService {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    service_id: row.service_id as string,
    service_name: row.service_name as string,
    description: row.description as string | undefined,
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    total_price: Number(row.total_price),
    service_type: row.service_type ?? undefined,
    tax_status: row.tax_status ?? null,
    tax_issued_at: row.tax_issued_at ?? null,
    tax_variable_cost_id: row.tax_variable_cost_id ?? null,
  }
}

// deno-lint-ignore no-explicit-any
function toProject(row: Record<string, any>, services?: ProjectService[]): Project {
  return {
    id: row.id as string,
    customer_id: row.customer_id as string,
    quote_id: row.quote_id ?? null,
    company_id: row.company_id ?? null,
    name: row.name as string,
    description: row.description ?? null,
    status: row.status as Project['status'],
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    total_value: Number(row.total_value),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    services,
  }
}

export const ProjectRepository = {
  async findAll(params: {
    limit: number
    offset: number
    status?: string
    customer_id?: string
    company_id?: string
    search?: string
  }): Promise<{ projects: Project[]; total: number }> {
    const { limit, offset, status, customer_id, company_id, search } = params
    const query = search?.trim()

    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM projects
      WHERE
        (${status ?? null}::text IS NULL OR status = ${status ?? null}::project_status_enum)
      AND (${customer_id ?? null}::uuid IS NULL OR customer_id = ${customer_id ?? null}::uuid)
      AND (${company_id ?? null}::uuid IS NULL OR company_id = ${company_id ?? null}::uuid)
      AND (${query ?? null}::text IS NULL OR name ILIKE ${`%${query ?? ''}%`})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { projects: rows.map((r) => toProject(r)), total }
  },

  async findById(id: string): Promise<Project | null> {
    const rows = await sql`SELECT * FROM projects WHERE id = ${id}`
    if (rows.length === 0) return null

    const serviceRows = await sql`
      SELECT ps.*, sc.name AS service_name
      FROM project_services ps
      JOIN services sc ON sc.id = ps.service_id
      WHERE ps.project_id = ${id}
      ORDER BY ps.id
    `
    const services = serviceRows.map(toProjectService)

    return toProject(rows[0], services)
  },

  async findServiceById(id: string): Promise<ProjectService | null> {
    const rows = await sql`
      SELECT ps.*, sc.name AS service_name
      FROM project_services ps
      JOIN services sc ON sc.id = ps.service_id
      WHERE ps.id = ${id}
    `
    return rows.length > 0 ? toProjectService(rows[0]) : null
  },

  async findInternalTaxServiceId(): Promise<string | null> {
    const rows = await sql`
      SELECT id FROM services
      WHERE name = 'Imposto interno'
      ORDER BY id
      LIMIT 1
    `
    return rows.length > 0 ? (rows[0].id as string) : null
  },

  async save(data: {
    customer_id: string
    quote_id?: string
    company_id?: string
    name: string
    description?: string
    start_date?: string
    end_date?: string
    total_value?: number
  }): Promise<Project> {
    const rows = await sql`
      INSERT INTO projects (customer_id, quote_id, company_id, name, description, start_date, end_date, total_value)
      VALUES (
        ${data.customer_id},
        ${data.quote_id ?? null},
        ${data.company_id ?? null},
        ${data.name},
        ${data.description ?? null},
        ${data.start_date ?? null},
        ${data.end_date ?? null},
        ${data.total_value ?? 0}
      )
      RETURNING *
    `
    return toProject(rows[0], [])
  },

  async update(
    id: string,
    data: {
      name?: string
      description?: string
      status?: Project['status']
      start_date?: string
      end_date?: string
      total_value?: number
      company_id?: string
    },
  ): Promise<Project | null> {
    const rows = await sql`
      UPDATE projects
      SET
        name = COALESCE(${data.name ?? null}, name),
        description = COALESCE(${data.description ?? null}, description),
        status = COALESCE(${data.status ?? null}::project_status_enum, status),
        start_date = COALESCE(${data.start_date ?? null}::date, start_date),
        end_date = COALESCE(${data.end_date ?? null}::date, end_date),
        total_value = COALESCE(${data.total_value ?? null}::numeric, total_value),
        company_id = COALESCE(${data.company_id ?? null}::uuid, company_id),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return rows.length > 0 ? toProject(rows[0]) : null
  },

  async hasPendingPayments(id: string): Promise<boolean> {
    const rows = await sql`
      SELECT COUNT(*)::int AS cnt FROM payments
      WHERE project_id = ${id} AND status = 'pending'
    `
    return (rows[0].cnt as number) > 0
  },

  async addService(data: {
    project_id: string
    service_id: string
    quantity: number
    unit_price: number
    description?: string
    service_type?: 'service' | 'tax_deduction'
    tax_status?: 'not_issued' | 'issued'
  }): Promise<ProjectService> {
    const rows = await sql`
      INSERT INTO project_services (project_id, service_id, quantity, unit_price, description, service_type, tax_status)
      VALUES (
        ${data.project_id},
        ${data.service_id},
        ${data.quantity},
        ${data.unit_price},
        ${data.description ?? null},
        ${data.service_type ?? 'service'}::project_service_type_enum,
        ${data.tax_status ?? null}::project_tax_status_enum
      )
      RETURNING *
    `
    return toProjectService(rows[0])
  },

  async updateService(
    id: string,
    data: {
      quantity?: number
      unit_price?: number
      description?: string
      tax_status?: 'not_issued' | 'issued'
      tax_issued_at?: string
      tax_variable_cost_id?: string
    },
  ): Promise<ProjectService | null> {
    const rows = await sql`
      UPDATE project_services
      SET
        quantity    = COALESCE(${data.quantity ?? null}::numeric, quantity),
        unit_price  = COALESCE(${data.unit_price ?? null}::numeric, unit_price),
        description = COALESCE(${data.description ?? null}, description),
        tax_status  = COALESCE(${data.tax_status ?? null}::project_tax_status_enum, tax_status),
        tax_issued_at = COALESCE(${data.tax_issued_at ?? null}::date, tax_issued_at),
        tax_variable_cost_id = COALESCE(${data.tax_variable_cost_id ?? null}::uuid, tax_variable_cost_id),
        updated_at  = now()
      WHERE id = ${id}
      RETURNING *
    `
    return rows.length > 0 ? toProjectService(rows[0]) : null
  },

  async removeService(id: string): Promise<void> {
    await sql`DELETE FROM project_services WHERE id = ${id}`
  },

  async delete(id: string): Promise<void> {
    // Deleta financial_entries dos payments do projeto
    await sql`
      DELETE FROM financial_entries
      WHERE source_type = 'payment'
        AND source_id IN (SELECT id FROM payments WHERE project_id = ${id})
    `
    // Deleta os payments do projeto
    await sql`DELETE FROM payments WHERE project_id = ${id}`
    // project_services é deletado em cascata automaticamente (FK com ON DELETE CASCADE)
    // Deleta o projeto
    await sql`DELETE FROM projects WHERE id = ${id}`
  },
}
