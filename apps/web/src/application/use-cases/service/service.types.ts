import type {
  TipoServico,
  StatusServico,
  FormaPagamento,
  ClienteInfo,
  CronogramaItem,
  PagamentoItem,
  DocumentoItem,
  CustoFixoItem,
  ParcelamentoItem,
} from '../../../domain/entities/service.entity'

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

export type UpdateServiceDto = Partial<CreateServiceDto>
