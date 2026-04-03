import sql from '../db.ts'
import {
  Service,
  ServiceStats,
  TipoServico,
  StatusServico,
  FormaPagamento,
  ClienteInfo,
  CronogramaItem,
  PagamentoItem,
  DocumentoItem,
  CustoFixoItem,
  ParcelamentoItem,
} from '../../_shared/domain/entities/service.entity.ts'

// deno-lint-ignore no-explicit-any
function toService(row: Record<string, any>): Service {
  return new Service(
    row.id as string,
    row.cliente as ClienteInfo,
    row.tipo as TipoServico,
    row.status as StatusServico,
    row.data_inicio as string,
    parseFloat(row.valor_total as string),
    row.forma_pagamento as FormaPagamento,
    new Date(row.created_at as string),
    new Date(row.updated_at as string),
    row.data_fim ?? undefined,
    (row.cronograma as CronogramaItem[]) ?? undefined,
    (row.pagamentos as PagamentoItem[]) ?? undefined,
    (row.documentos as DocumentoItem[]) ?? undefined,
    (row.custos_fixos as CustoFixoItem[]) ?? undefined,
    (row.parcelamento as ParcelamentoItem[]) ?? undefined,
  )
}

export const ServiceRepository = {
  async findAll(): Promise<Service[]> {
    const rows = await sql`SELECT * FROM services ORDER BY created_at DESC`
    return rows.map(toService)
  },

  async findAllPaginated(
    limit: number,
    offset: number,
    status?: string,
    clienteId?: string,
  ): Promise<{ services: Service[]; total: number }> {
    const rows = status
      ? await sql`
          SELECT *, COUNT(*) OVER()::int AS total_count
          FROM services
          WHERE status = ${status}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : clienteId
        ? await sql`
            SELECT *, COUNT(*) OVER()::int AS total_count
            FROM services
            WHERE cliente->>'id' = ${clienteId}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : await sql`
            SELECT *, COUNT(*) OVER()::int AS total_count
            FROM services
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { services: rows.map(toService), total }
  },

  async findById(id: string): Promise<Service | null> {
    const rows = await sql`SELECT * FROM services WHERE id = ${id}`
    return rows.length > 0 ? toService(rows[0]) : null
  },

  async findByStatus(status: string): Promise<Service[]> {
    const rows = await sql`
      SELECT * FROM services WHERE status = ${status} ORDER BY created_at DESC
    `
    return rows.map(toService)
  },

  async findByClienteId(clienteId: string): Promise<Service[]> {
    const rows = await sql`
      SELECT * FROM services WHERE cliente->>'id' = ${clienteId} ORDER BY created_at DESC
    `
    return rows.map(toService)
  },

  async save(service: Service): Promise<Service> {
    const rows = await sql`
      INSERT INTO services (
        id, cliente, tipo, status, data_inicio, data_fim,
        valor_total, forma_pagamento,
        cronograma, pagamentos, documentos, custos_fixos, parcelamento,
        created_at, updated_at
      )
      VALUES (
        ${service.id},
        ${sql.json(service.cliente)},
        ${service.tipo},
        ${service.status},
        ${service.data_inicio},
        ${service.data_fim ?? null},
        ${service.valor_total},
        ${service.forma_pagamento},
        ${service.cronograma ? sql.json(service.cronograma) : null},
        ${service.pagamentos ? sql.json(service.pagamentos) : null},
        ${service.documentos ? sql.json(service.documentos) : null},
        ${service.custos_fixos ? sql.json(service.custos_fixos) : null},
        ${service.parcelamento ? sql.json(service.parcelamento) : null},
        ${service.createdAt.toISOString()},
        ${service.updatedAt.toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        cliente         = EXCLUDED.cliente,
        tipo            = EXCLUDED.tipo,
        status          = EXCLUDED.status,
        data_inicio     = EXCLUDED.data_inicio,
        data_fim        = EXCLUDED.data_fim,
        valor_total     = EXCLUDED.valor_total,
        forma_pagamento = EXCLUDED.forma_pagamento,
        cronograma      = EXCLUDED.cronograma,
        pagamentos      = EXCLUDED.pagamentos,
        documentos      = EXCLUDED.documentos,
        custos_fixos    = EXCLUDED.custos_fixos,
        parcelamento    = EXCLUDED.parcelamento,
        updated_at      = EXCLUDED.updated_at
      RETURNING *
    `
    return toService(rows[0])
  },

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM services WHERE id = ${id}`
  },

  async getStats(): Promise<ServiceStats> {
    const rows = await sql`
      SELECT
        COUNT(*)::int                                              AS total,
        COUNT(*) FILTER (WHERE status = 'EM_ANDAMENTO')::int      AS em_andamento,
        COUNT(*) FILTER (WHERE status = 'CONCLUIDO')::int         AS concluidos,
        COUNT(*) FILTER (WHERE status = 'PAUSADO')::int           AS pausados,
        COUNT(*) FILTER (WHERE status = 'CANCELADO')::int         AS cancelados
      FROM services
    `
    return rows[0] as ServiceStats
  },
}
