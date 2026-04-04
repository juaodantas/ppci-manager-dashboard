export type ProjectStatus = 'planning' | 'in_progress' | 'finished' | 'canceled'

export interface ProjectService {
  id: string
  project_id: string
  service_id: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
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
