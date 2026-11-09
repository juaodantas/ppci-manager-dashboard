import type { Quote } from '@manager/domain'
import type { UpdateQuoteDto } from '../../domain/repositories/quote.repository'

export interface QuoteEditItem {
  service_id: string
  description: string
  quantity: string
  unit_price: string
}
export interface QuoteEditForm {
  company_id: string
  valid_until: string
  notes: string
  discount: string
  items: QuoteEditItem[]
}
export type QuoteEditErrors = Partial<Record<'company_id' | 'valid_until' | 'discount' | 'items', string>> & {
  rows: Partial<Record<keyof QuoteEditItem | 'total', string>>[]
}

const MAX_CENTS = 9999999999n

// Parse decimal text rather than multiplying binary floats; harmless trailing zeros
// are equivalent, but nonzero precision beyond the database scale is rejected.
export function decimalUnits(text: string, scale: number): bigint | null {
  const match = /^(\d+)(?:\.(\d*))?$/.exec(text.trim())
  if (!match) return null
  const fraction = (match[2] ?? '').replace(/0+$/, '')
  if (fraction.length > scale) return null
  return BigInt(match[1]) * 10n ** BigInt(scale) + BigInt(fraction.padEnd(scale, '0') || '0')
}

export function lineCents(item: QuoteEditItem): bigint | null {
  const quantity = decimalUnits(item.quantity, 3)
  const price = decimalUnits(item.unit_price, 2)
  if (quantity === null || price === null) return null
  // Positive numeric PostgreSQL round: half away from zero, per line.
  return (quantity * price + 500n) / 1000n
}

export function localDateValue(value?: string | null): string {
  return value?.slice(0, 10) ?? ''
}

export function formatQuoteDate(value?: string | null): string {
  const date = localDateValue(value)
  if (!date) return '—'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function quoteToEditForm(quote: Quote): QuoteEditForm {
  return {
    company_id: quote.company_id ?? '',
    valid_until: localDateValue(quote.valid_until),
    notes: quote.notes ?? '',
    discount: String(quote.discount ?? 0),
    items: (quote.items ?? []).map((item) => ({
      service_id: item.service_id,
      description: item.description ?? '',
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
    })),
  }
}

export function quoteEditDto(form: QuoteEditForm): UpdateQuoteDto {
  return {
    ...(form.company_id ? { company_id: form.company_id } : {}),
    valid_until: form.valid_until || null,
    notes: form.notes.trim() || null,
    discount: Number(form.discount.trim() || '0'),
    items: form.items.map((item) => ({
      service_id: item.service_id,
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  }
}

function normalizedNumber(value: string, scale: number): string {
  return decimalUnits(value, scale)?.toString() ?? `invalid:${value.trim()}`
}

export function quoteEditFingerprint(form: QuoteEditForm): string {
  return JSON.stringify({
    ...form,
    notes: form.notes.trim(),
    discount: normalizedNumber(form.discount.trim() || '0', 2),
    items: form.items.map((item) => ({
      ...item,
      description: item.description.trim(),
      quantity: normalizedNumber(item.quantity, 3),
      unit_price: normalizedNumber(item.unit_price, 2),
    })),
  })
}

export function validateQuoteEdit(form: QuoteEditForm, originalCompanyId = '') {
  const errors: QuoteEditErrors = { rows: [] }
  if (originalCompanyId && !form.company_id) errors.company_id = 'Selecione uma empresa executora.'
  if (form.valid_until && !validDate(form.valid_until)) errors.valid_until = 'Informe uma data válida.'
  if (!form.items.length) errors.items = 'Adicione pelo menos um item.'
  let subtotal = 0n
  form.items.forEach((item, index) => {
    const row: QuoteEditErrors['rows'][number] = {}
    const quantity = decimalUnits(item.quantity, 3)
    const price = decimalUnits(item.unit_price, 2)
    if (!item.service_id) row.service_id = 'Selecione um serviço.'
    if (quantity === null || quantity <= 0n || quantity > 9999999999n) {
      row.quantity = 'Use quantidade positiva até 9.999.999,999, com até 3 casas decimais.'
    }
    if (price === null || price <= 0n || price > MAX_CENTS) {
      row.unit_price = 'Use preço positivo até R$ 99.999.999,99, com até 2 casas decimais.'
    }
    const total = lineCents(item)
    if (total !== null) {
      subtotal += total
      if (total > MAX_CENTS) row.total = 'O total do item excede R$ 99.999.999,99.'
    }
    errors.rows[index] = row
  })
  if (subtotal > MAX_CENTS) errors.items = 'O subtotal excede R$ 99.999.999,99.'
  const discount = decimalUnits(form.discount.trim() || '0', 2)
  if (discount === null || discount > subtotal) {
    errors.discount = 'Use desconto não negativo, com até 2 casas decimais e no máximo o subtotal.'
  }
  const valid = !errors.company_id && !errors.valid_until && !errors.discount && !errors.items &&
    errors.rows.every((row) => Object.keys(row).length === 0)
  return { valid, errors, subtotal, discount: discount ?? 0n, total: subtotal - (discount ?? 0n) }
}

export function formatQuoteMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
