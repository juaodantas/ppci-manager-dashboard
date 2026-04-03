import {
  Service,
  TipoServico,
  StatusServico,
  FormaPagamento,
  ClienteInfo,
  CronogramaItem,
  PagamentoItem,
  DocumentoItem,
  CustoFixoItem,
  ParcelamentoItem,
} from '../../../_shared/domain/entities/service.entity.ts'
import { ServiceRepository } from '../../repositories/service.repository.ts'

export interface CreateServiceDto {
  cliente: ClienteInfo
  tipo: TipoServico
  status: StatusServico
  data_inicio: string
  data_fim?: string
  valor_total: number
  forma_pagamento: FormaPagamento
  cronograma?: CronogramaItem[]
  pagamentos?: PagamentoItem[]
  documentos?: DocumentoItem[]
  custos_fixos?: CustoFixoItem[]
  parcelamento?: ParcelamentoItem[]
}

function ensureIds<T extends { id?: string }>(items: T[] | undefined, prefix: string): T[] | undefined {
  if (!items) return undefined
  return items.map((item) => ({
    ...item,
    id: item.id ?? `${prefix}-${crypto.randomUUID().slice(0, 8)}`,
  }))
}

export async function createService(dto: CreateServiceDto): Promise<Service> {
  const now = new Date()
  const service = new Service(
    crypto.randomUUID(),
    dto.cliente,
    dto.tipo,
    dto.status,
    dto.data_inicio,
    dto.valor_total,
    dto.forma_pagamento,
    now,
    now,
    dto.data_fim,
    ensureIds(dto.cronograma, 'crn'),
    ensureIds(dto.pagamentos, 'pgt'),
    ensureIds(dto.documentos, 'doc'),
    ensureIds(dto.custos_fixos, 'cst'),
    ensureIds(dto.parcelamento, 'prc'),
  )
  return ServiceRepository.save(service)
}
