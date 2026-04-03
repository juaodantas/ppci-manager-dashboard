import { z } from 'zod'
import {
  TipoServico,
  StatusServico,
  FormaPagamento,
  StatusCronograma,
  StatusPagamento,
  TipoDocumento,
  CategoriaCusto,
} from '@manager/domain'

export const createServiceSchema = z.object({
  cliente: z.object({
    id: z.string(),
    nome: z.string().min(1, 'Nome do cliente é obrigatório'),
    email: z.string().email('Email do cliente inválido'),
  }),
  tipo: z.nativeEnum(TipoServico, { message: 'Tipo inválido' }),
  status: z.nativeEnum(StatusServico, { message: 'Status inválido' }),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  valor_total: z.number({ invalid_type_error: 'Valor total deve ser um número' }).positive('Valor total deve ser positivo'),
  forma_pagamento: z.nativeEnum(FormaPagamento, { message: 'Forma de pagamento inválida' }),
  cronograma: z
    .array(
      z.object({
        id: z.string().optional(),
        descricao: z.string().min(1),
        data_prevista: z.string(),
        data_realizada: z.string().optional(),
        status: z.nativeEnum(StatusCronograma),
      }),
    )
    .optional(),
  pagamentos: z
    .array(
      z.object({
        id: z.string().optional(),
        valor: z.number().positive(),
        data_vencimento: z.string(),
        data_pagamento: z.string().optional(),
        status: z.nativeEnum(StatusPagamento),
      }),
    )
    .optional(),
  documentos: z
    .array(
      z.object({
        id: z.string().optional(),
        nome: z.string().min(1),
        url: z.string().url(),
        tipo: z.nativeEnum(TipoDocumento),
        data_upload: z.string(),
      }),
    )
    .optional(),
  custos_fixos: z
    .array(
      z.object({
        id: z.string().optional(),
        descricao: z.string().min(1),
        valor: z.number().positive(),
        categoria: z.nativeEnum(CategoriaCusto),
      }),
    )
    .optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceFormValues = z.infer<typeof createServiceSchema>
export type UpdateServiceFormValues = z.infer<typeof updateServiceSchema>
