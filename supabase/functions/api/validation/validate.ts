import { z } from 'npm:zod'
import { badRequest } from '../errors.ts'

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    const message = result.error.errors[0]?.message ?? 'Invalid request body'
    throw badRequest(message)
  }
  return result.data
}
