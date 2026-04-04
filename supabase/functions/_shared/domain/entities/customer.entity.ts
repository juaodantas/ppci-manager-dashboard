export interface Customer {
  id: string
  name: string
  document?: string
  email?: string
  phone?: string
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export function isDeleted(customer: Customer): boolean {
  return customer.deleted_at != null
}
