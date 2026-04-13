import { z } from 'npm:zod'

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
  .refine((data: { name?: string; password?: string }) => data.name !== undefined || data.password !== undefined, {
    message: 'at least one field (name or password) must be provided',
  })

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
})

// Customer
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'name is required'),
  document: z.string().optional(),
  email: z.string().email('invalid email').optional(),
  phone: z.string().optional(),
})

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  document: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

// Service Catalog
export const createServiceCatalogSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  unit_type: z.string().optional(),
})

export const updateServiceCatalogSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit_type: z.string().optional(),
})

export const addServicePriceSchema = z.object({
  price_per_unit: z.number().positive(),
  minimum_price: z.number().min(0).optional(),
  valid_from: z.string().optional(),
})

// Quote
const quoteItemSchema = z.object({
  service_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  description: z.string().optional(),
})

export const createQuoteSchema = z.object({
  customer_id: z.string().uuid(),
  valid_until: z.string().optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1),
})

export const updateQuoteSchema = z.object({
  valid_until: z.string().optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'rejected']).optional(),
  items: z.array(quoteItemSchema).optional(),
})

export const approveQuoteSchema = z.object({
  name: z.string().min(1),
  start_date: z.string().optional(),
})

// Project
export const createProjectSchema = z.object({
  customer_id: z.string().uuid(),
  quote_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  total_value: z.number().min(0).optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'finished', 'canceled']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  total_value: z.number().min(0).optional(),
})

export const addProjectServiceSchema = z.object({
  service_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  description: z.string().optional(),
})

export const updateProjectServiceSchema = addProjectServiceSchema.partial()

// Payment
export const createPaymentSchema = z.object({
  project_id: z.string().uuid(),
  amount: z.number().positive(),
  due_date: z.string().min(1, 'due_date is required'),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
})

export const payPaymentSchema = z.object({
  paid_date: z.string().min(1, 'paid_date is required'),
})

// Fixed Cost
export const createFixedCostSchema = z.object({
  name: z.string().min(1, 'name is required'),
  amount: z.number().positive(),
  due_day: z.number().int().min(1).max(31),
  category: z.string().optional(),
})

export const updateFixedCostSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  due_day: z.number().int().min(1).max(31).optional(),
  category: z.string().optional(),
})

// Variable Cost
export const createVariableCostSchema = z.object({
  name: z.string().min(1, 'name is required'),
  amount: z.number().positive(),
  date: z.string().date(),
  category: z.string().optional(),
  description: z.string().optional(),
})

export const updateVariableCostSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().date().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
})

// Types
export type RefreshDto = z.infer<typeof refreshSchema>
export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>
export type CreateServiceCatalogDto = z.infer<typeof createServiceCatalogSchema>
export type UpdateServiceCatalogDto = z.infer<typeof updateServiceCatalogSchema>
export type AddServicePriceDto = z.infer<typeof addServicePriceSchema>
export type CreateQuoteDto = z.infer<typeof createQuoteSchema>
export type UpdateQuoteDto = z.infer<typeof updateQuoteSchema>
export type ApproveQuoteDto = z.infer<typeof approveQuoteSchema>
export type CreateProjectDto = z.infer<typeof createProjectSchema>
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>
export type AddProjectServiceDto = z.infer<typeof addProjectServiceSchema>
export type UpdateProjectServiceDto = z.infer<typeof updateProjectServiceSchema>
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>
export type PayPaymentDto = z.infer<typeof payPaymentSchema>
export type CreateFixedCostDto = z.infer<typeof createFixedCostSchema>
export type UpdateFixedCostDto = z.infer<typeof updateFixedCostSchema>
export type CreateVariableCostDto = z.infer<typeof createVariableCostSchema>
export type UpdateVariableCostDto = z.infer<typeof updateVariableCostSchema>
