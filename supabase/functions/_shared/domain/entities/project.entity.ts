export type ProjectStatus = 'planning' | 'in_progress' | 'finished' | 'finished_pending_payment' | 'canceled'

export type ProjectServiceType = 'service' | 'tax_deduction'
export type ProjectTaxStatus = 'not_issued' | 'issued'

export interface ProjectService {
  id: string
  project_id: string
  service_id: string
  service_name: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
  service_type?: ProjectServiceType
  tax_status?: ProjectTaxStatus | null
  tax_issued_at?: string | null
  tax_variable_cost_id?: string | null
}

export interface Project {
  id: string
  customer_id: string
  quote_id?: string | null
  name: string
  description?: string | null
  status: ProjectStatus
  start_date?: string | null
  end_date?: string | null
  total_value: number
  created_at: string
  updated_at: string
  services?: ProjectService[]
}
