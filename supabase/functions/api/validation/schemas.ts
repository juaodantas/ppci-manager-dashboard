import { z } from 'npm:zod'
import {
  TipoServico,
  StatusServico,
  FormaPagamento,
  StatusCronograma,
  StatusPagamento,
  TipoDocumento,
  CategoriaCusto,
} from '../../_shared/domain/entities/service.entity.ts'

// Auth
export const registerSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('invalid email'),
  password: z.string().min(6, 'password must be at least 6 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('invalid email'),
  password: z.string().min(1, 'password is required'),
})

// User
export const createUserSchema = registerSchema

export const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    password: z.string().min(6).optional(),
  })
  .refine((data) => data.name !== undefined || data.password !== undefined, {
    message: 'at least one field (name or password) must be provided',
  })

// Service nested schemas
const clienteInfoSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, 'client name is required'),
  email: z.string().email('invalid client email'),
})

const cronogramaItemSchema = z.object({
  id: z.string().optional(),
  descricao: z.string().min(1),
  data_prevista: z.string(),
  data_realizada: z.string().optional(),
  status: z.nativeEnum(StatusCronograma),
})

const pagamentoItemSchema = z.object({
  id: z.string().optional(),
  valor: z.number().positive(),
  data_vencimento: z.string(),
  data_pagamento: z.string().optional(),
  status: z.nativeEnum(StatusPagamento),
})

const documentoItemSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1),
  url: z.string().url(),
  tipo: z.nativeEnum(TipoDocumento),
  data_upload: z.string(),
})

const custoFixoItemSchema = z.object({
  id: z.string().optional(),
  descricao: z.string().min(1),
  valor: z.number().positive(),
  categoria: z.nativeEnum(CategoriaCusto),
})

const parcelamentoItemSchema = z.object({
  id: z.string().optional(),
  numero_parcela: z.number().int().positive(),
  valor: z.number().positive(),
  data_vencimento: z.string(),
  data_pagamento: z.string().optional(),
  status: z.nativeEnum(StatusPagamento),
})

export const createServiceSchema = z.object({
  cliente: clienteInfoSchema,
  tipo: z.nativeEnum(TipoServico),
  status: z.nativeEnum(StatusServico),
  data_inicio: z.string().min(1, 'data_inicio is required'),
  data_fim: z.string().optional(),
  valor_total: z.number().positive('valor_total must be positive'),
  forma_pagamento: z.nativeEnum(FormaPagamento),
  cronograma: z.array(cronogramaItemSchema).optional(),
  pagamentos: z.array(pagamentoItemSchema).optional(),
  documentos: z.array(documentoItemSchema).optional(),
  custos_fixos: z.array(custoFixoItemSchema).optional(),
  parcelamento: z.array(parcelamentoItemSchema).optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
})

export type RefreshDto = z.infer<typeof refreshSchema>
export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>
export type CreateServiceDto = z.infer<typeof createServiceSchema>
export type UpdateServiceDto = z.infer<typeof updateServiceSchema>
