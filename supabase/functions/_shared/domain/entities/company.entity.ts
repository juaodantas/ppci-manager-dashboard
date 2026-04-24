export type CompanyType = 'internal' | 'supplier' | 'outsourced'

export interface Company {
  id: string
  name: string
  cnpj: string
  responsible: string
  type: CompanyType
  created_at: string
  updated_at: string
}
