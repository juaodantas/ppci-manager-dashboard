import type { QuoteItem } from '@manager/domain'

export type ServiceNameById = Record<string, string>

export function getQuoteItemLabel(item: QuoteItem, index: number, serviceNameById: ServiceNameById): string {
  const description = item.description?.trim()
  const serviceName = serviceNameById[item.service_id]
  if (serviceName && description) return `${serviceName} — ${description}`
  if (description) return description
  if (serviceName) return serviceName

  return `Serviço ${index + 1}`
}
