import sql from '../db.ts'
import {
  ServiceCatalogItem,
  ServiceCatalogWithCategory,
  ServiceCategory,
  ServicePrice,
} from '../../_shared/domain/entities/service-catalog.entity.ts'

// deno-lint-ignore no-explicit-any
function toServiceCategory(row: Record<string, any>): ServiceCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
  }
}

// deno-lint-ignore no-explicit-any
function toServicePrice(row: Record<string, any>): ServicePrice {
  return {
    id: row.price_id as string,
    service_id: row.id as string,
    price_per_unit: Number(row.price_per_unit),
    minimum_price: row.minimum_price != null ? Number(row.minimum_price) : undefined,
    valid_from: row.valid_from as string,
    valid_to: row.valid_to as string | null | undefined,
  }
}

// deno-lint-ignore no-explicit-any
function toServiceCatalogItem(row: Record<string, any>): ServiceCatalogItem {
  return {
    id: row.id as string,
    category_id: row.category_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    unit_type: row.unit_type as string | undefined,
    is_active: row.is_active as boolean,
    current_price: row.price_id != null ? toServicePrice(row) : undefined,
  }
}

// deno-lint-ignore no-explicit-any
function toServiceCatalogWithCategory(row: Record<string, any>): ServiceCatalogWithCategory {
  return {
    ...toServiceCatalogItem(row),
    category: {
      id: row.category_id as string,
      name: row.category_name as string,
      description: row.category_description as string | undefined,
    },
  }
}

export interface CreateServiceData {
  category_id: string
  name: string
  description?: string
  unit_type?: string
}

export interface UpdateServiceData {
  name?: string
  description?: string
  unit_type?: string
}

export interface CreateServicePriceData {
  price_per_unit: number
  minimum_price?: number
  valid_from?: string
}

export const ServiceCatalogRepository = {
  async findAllWithCategory(includeInactive = false): Promise<ServiceCatalogWithCategory[]> {
    const rows = await sql`
      SELECT
        s.*,
        sc.name        AS category_name,
        sc.description AS category_description,
        sp.id          AS price_id,
        sp.price_per_unit,
        sp.minimum_price,
        sp.valid_from,
        sp.valid_to
      FROM services s
      JOIN service_category sc ON sc.id = s.category_id
      LEFT JOIN LATERAL (
        SELECT sp.id, sp.price_per_unit, sp.minimum_price, sp.valid_from, sp.valid_to
        FROM service_price sp
        WHERE sp.service_id = s.id AND sp.valid_to IS NULL
        ORDER BY sp.valid_from DESC, sp.id DESC
        LIMIT 1
      ) sp ON true
      WHERE ${includeInactive ? sql`TRUE` : sql`s.is_active = TRUE`}
      ORDER BY sc.name, s.name
    `
    return rows.map(toServiceCatalogWithCategory)
  },

  async findById(id: string): Promise<ServiceCatalogItem | null> {
    const rows = await sql`
      SELECT
        s.*,
        sp.id          AS price_id,
        sp.price_per_unit,
        sp.minimum_price,
        sp.valid_from,
        sp.valid_to
      FROM services s
      LEFT JOIN LATERAL (
        SELECT sp.id, sp.price_per_unit, sp.minimum_price, sp.valid_from, sp.valid_to
        FROM service_price sp
        WHERE sp.service_id = s.id AND sp.valid_to IS NULL
        ORDER BY sp.valid_from DESC, sp.id DESC
        LIMIT 1
      ) sp ON true
      WHERE s.id = ${id}
    `
    return rows.length > 0 ? toServiceCatalogItem(rows[0]) : null
  },

  async findCategories(): Promise<ServiceCategory[]> {
    const rows = await sql`SELECT * FROM service_category ORDER BY name`
    return rows.map(toServiceCategory)
  },

  async save(data: CreateServiceData): Promise<ServiceCatalogItem> {
    const rows = await sql`
      INSERT INTO services (id, category_id, name, description, unit_type, is_active, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()},
        ${data.category_id},
        ${data.name},
        ${data.description ?? null},
        ${data.unit_type ?? null},
        TRUE,
        NOW(),
        NOW()
      )
      RETURNING *
    `
    return toServiceCatalogItem(rows[0])
  },

  async update(id: string, data: UpdateServiceData): Promise<ServiceCatalogItem | null> {
    const rows = await sql`
      UPDATE services
      SET
        name        = COALESCE(${data.name ?? null}, name),
        description = COALESCE(${data.description ?? null}, description),
        unit_type   = COALESCE(${data.unit_type ?? null}, unit_type),
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return rows.length > 0 ? toServiceCatalogItem(rows[0]) : null
  },

  async deactivate(id: string): Promise<void> {
    await sql`
      UPDATE services
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = ${id}
    `
  },

  async addPrice(serviceId: string, price: CreateServicePriceData): Promise<ServicePrice> {
    await sql`
      UPDATE service_price
      SET valid_to = NOW()
      WHERE service_id = ${serviceId} AND valid_to IS NULL
    `
    const rows = await sql`
      INSERT INTO service_price (id, service_id, price_per_unit, minimum_price, valid_from, valid_to)
      VALUES (
        ${crypto.randomUUID()},
        ${serviceId},
        ${price.price_per_unit},
        ${price.minimum_price ?? null},
        ${price.valid_from ?? new Date().toISOString()},
        NULL
      )
      RETURNING *
    `
    const row = rows[0]
    return {
      id: row.id as string,
      service_id: row.service_id as string,
      price_per_unit: Number(row.price_per_unit),
      minimum_price: row.minimum_price != null ? Number(row.minimum_price) : undefined,
      valid_from: row.valid_from as string,
      valid_to: row.valid_to as string | null,
    }
  },
}
