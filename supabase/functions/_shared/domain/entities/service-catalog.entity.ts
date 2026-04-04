export interface ServiceCategory {
  id: string
  name: string
  description?: string
}

export interface ServiceCatalogItem {
  id: string
  category_id: string
  name: string
  description?: string
  unit_type?: string
  is_active: boolean
  current_price?: ServicePrice
}

export interface ServicePrice {
  id: string
  service_id: string
  price_per_unit: number
  minimum_price?: number
  valid_from: string
  valid_to?: string | null
}

export interface ServiceCatalogWithCategory extends ServiceCatalogItem {
  category: ServiceCategory
}
