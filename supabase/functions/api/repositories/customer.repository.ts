import sql from '../db.ts'
import { Customer } from '../../_shared/domain/entities/customer.entity.ts'

// deno-lint-ignore no-explicit-any
function toCustomer(row: Record<string, any>): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    document: row.document as string | undefined,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    deleted_at: row.deleted_at as string | null | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export interface CustomerWithCounts extends Customer {
  quote_count: number
  project_count: number
}

// deno-lint-ignore no-explicit-any
function toCustomerWithCounts(row: Record<string, any>): CustomerWithCounts {
  return {
    ...toCustomer(row),
    quote_count: Number(row.quote_count ?? 0),
    project_count: Number(row.project_count ?? 0),
  }
}

export interface CreateCustomerData {
  name: string
  document?: string
  email?: string
  phone?: string
}

export interface UpdateCustomerData {
  name?: string
  document?: string
  email?: string
  phone?: string
}

export const CustomerRepository = {
  async findAll(limit: number, offset: number): Promise<{ customers: Customer[]; total: number }> {
    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM customers
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { customers: rows.map(toCustomer), total }
  },

  async findById(id: string): Promise<CustomerWithCounts | null> {
    const rows = await sql`
      SELECT
        c.*,
        COUNT(DISTINCT q.id)::int AS quote_count,
        COUNT(DISTINCT p.id)::int AS project_count
      FROM customers c
      LEFT JOIN quotes q ON q.customer_id = c.id
      LEFT JOIN projects p ON p.customer_id = c.id
      WHERE c.id = ${id} AND c.deleted_at IS NULL
      GROUP BY c.id
    `
    return rows.length > 0 ? toCustomerWithCounts(rows[0]) : null
  },

  async save(data: CreateCustomerData): Promise<Customer> {
    const rows = await sql`
      INSERT INTO customers (id, name, document, email, phone, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()},
        ${data.name},
        ${data.document ?? null},
        ${data.email ?? null},
        ${data.phone ?? null},
        NOW(),
        NOW()
      )
      RETURNING *
    `
    return toCustomer(rows[0])
  },

  async update(id: string, data: UpdateCustomerData): Promise<Customer | null> {
    const rows = await sql`
      UPDATE customers
      SET
        name      = COALESCE(${data.name ?? null}, name),
        document  = COALESCE(${data.document ?? null}, document),
        email     = COALESCE(${data.email ?? null}, email),
        phone     = COALESCE(${data.phone ?? null}, phone),
        updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `
    return rows.length > 0 ? toCustomer(rows[0]) : null
  },

  async softDelete(id: string): Promise<void> {
    await sql`
      UPDATE customers
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
    `
  },
}
