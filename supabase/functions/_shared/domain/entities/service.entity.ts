// Enums migrados de manager-api/src/servicos/entities/servico.entity.ts
export enum TipoServico {
  OBRA_INCENDIO = 'OBRA_INCENDIO',
  CONSULTORIA = 'CONSULTORIA',
  PROJETO = 'PROJETO',
  MANUTENCAO = 'MANUTENCAO',
}

export enum StatusServico {
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  PAUSADO = 'PAUSADO',
  CANCELADO = 'CANCELADO',
}

export enum StatusCronograma {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
}

export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  ATRASADO = 'ATRASADO',
}

export enum TipoDocumento {
  CONTRATO = 'CONTRATO',
  PROJETO = 'PROJETO',
  ART = 'ART',
  LAUDO = 'LAUDO',
  OUTROS = 'OUTROS',
}

export enum CategoriaCusto {
  MATERIAL = 'MATERIAL',
  MAO_OBRA = 'MAO_OBRA',
  EQUIPAMENTO = 'EQUIPAMENTO',
  OUTROS = 'OUTROS',
}

export enum FormaPagamento {
  A_VISTA = 'A_VISTA',
  PARCELADO = 'PARCELADO',
  MENSAL = 'MENSAL',
}

export interface ClienteInfo {
  id: string
  nome: string
  email: string
}

export interface CronogramaItem {
  id?: string
  descricao: string
  data_prevista: string
  data_realizada?: string
  status: StatusCronograma
}

export interface PagamentoItem {
  id?: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: StatusPagamento
}

export interface DocumentoItem {
  id?: string
  nome: string
  url: string
  tipo: TipoDocumento
  data_upload: string
}

export interface CustoFixoItem {
  id?: string
  descricao: string
  valor: number
  categoria: CategoriaCusto
}

export interface ParcelamentoItem {
  id?: string
  numero_parcela: number
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: StatusPagamento
}

export interface ServiceStats {
  total: number
  em_andamento: number
  concluidos: number
  pausados: number
  cancelados: number
}

export class Service {
  constructor(
    public readonly id: string,
    public cliente: ClienteInfo,
    public tipo: TipoServico,
    public status: StatusServico,
    public data_inicio: string,
    public valor_total: number,
    public forma_pagamento: FormaPagamento,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public data_fim?: string,
    public cronograma?: CronogramaItem[],
    public pagamentos?: PagamentoItem[],
    public documentos?: DocumentoItem[],
    public custos_fixos?: CustoFixoItem[],
    public parcelamento?: ParcelamentoItem[],
  ) {}

  updateStatus(status: StatusServico): void {
    this.status = status
    this.updatedAt = new Date()
  }

  conclude(data_fim: string): void {
    this.status = StatusServico.CONCLUIDO
    this.data_fim = data_fim
    this.updatedAt = new Date()
  }

  isActive(): boolean {
    return (
      this.status === StatusServico.EM_ANDAMENTO ||
      this.status === StatusServico.PAUSADO
    )
  }
}
