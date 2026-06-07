import { z } from 'npm:zod'

export const fixedCostMonthQuerySchema = z.object({
  reference_year: z.coerce.number().int().min(1900).max(9999),
  reference_month: z.coerce.number().int().min(1).max(12),
  company_id: z.string().uuid().optional(),
})

export const fixedCostMonthParamsSchema = z.object({
  id: z.string().uuid(),
  reference_year: z.coerce.number().int().min(1900).max(9999),
  reference_month: z.coerce.number().int().min(1).max(12),
})

export const fixedCostMonthActionParamsSchema = z.object({
  reference_year: z.coerce.number().int().min(1900).max(9999),
  reference_month: z.coerce.number().int().min(1).max(12),
  company_id: z.string().uuid().optional(),
})

export const upsertFixedCostMonthEntrySchema = z.object({
  amount: z.number().min(0),
  interest_amount: z.number().optional(),
  due_day: z.number().int().min(1).max(31).optional(),
  name: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  included: z.boolean().optional(),
})

export type FixedCostMonthQueryDto = z.infer<typeof fixedCostMonthQuerySchema>
export type FixedCostMonthParamsDto = z.infer<typeof fixedCostMonthParamsSchema>
export type FixedCostMonthActionParamsDto = z.infer<typeof fixedCostMonthActionParamsSchema>
export type UpsertFixedCostMonthEntryDto = z.infer<typeof upsertFixedCostMonthEntrySchema>
