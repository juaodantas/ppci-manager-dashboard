import { describe, expect, it } from 'vitest'
import type { Quote } from '@manager/domain'
import {
  decimalUnits, formatQuoteDate, lineCents, localDateValue, quoteEditDto,
  quoteEditFingerprint, quoteToEditForm, validateQuoteEdit, type QuoteEditForm,
} from './quote-edit'

const makeForm = (): QuoteEditForm => ({
  company_id: 'company-original', valid_until: '2026-11-09', notes: 'Persistido', discount: '0',
  items: [{ service_id: 'inactive-service', description: 'Descrição negociada', quantity: '1', unit_price: '19.99' }],
})

describe('quote edit snapshot and DTO', () => {
  it('hydrates persisted descriptions, prices and missing company without depending on catalog', () => {
    const quote = {
      company_id: null, valid_until: '2026-11-09', notes: null, discount: 0,
      items: [{ service_id: 'inactive-service', description: 'Descrição negociada', quantity: 1.125, unit_price: 19.99 }],
    } as unknown as Quote
    expect(quoteToEditForm(quote)).toEqual({
      company_id: '', valid_until: '2026-11-09', notes: '', discount: '0',
      items: [{ service_id: 'inactive-service', description: 'Descrição negociada', quantity: '1.125', unit_price: '19.99' }],
    })
  })

  it('sends explicit zero and null clears, every item, but never customer or status', () => {
    const form = makeForm()
    form.company_id = ''
    form.valid_until = ''
    form.notes = '  '
    const dto = quoteEditDto(form)
    expect(dto).toEqual({ valid_until: null, notes: null, discount: 0, items: [{
      service_id: 'inactive-service', description: 'Descrição negociada', quantity: 1, unit_price: 19.99,
    }] })
    expect(dto).not.toHaveProperty('customer_id')
    expect(dto).not.toHaveProperty('status')
    expect(dto).not.toHaveProperty('company_id')
    form.items.push({ service_id: '', quantity: '', unit_price: '', description: '' })
    expect(quoteEditDto(form).items).toHaveLength(2)
    expect(validateQuoteEdit(form).valid).toBe(false)
  })

  it('includes a selected company and preserves a cleared item description', () => {
    const form = makeForm()
    form.items[0].description = ''
    expect(quoteEditDto(form)).toMatchObject({ company_id: 'company-original', items: [{ description: '' }] })
  })
})

describe('semantic dirty comparison', () => {
  it('normalizes numeric representations, whitespace and empty discount', () => {
    const original = makeForm()
    const changed = makeForm()
    changed.items[0].quantity = '01.000'
    changed.items[0].unit_price = '19.9900'
    changed.items[0].description = '  Descrição negociada  '
    changed.notes = ' Persistido '
    changed.discount = ''
    expect(quoteEditFingerprint(changed)).toBe(quoteEditFingerprint(original))
    changed.items[0].unit_price = '20'
    expect(quoteEditFingerprint(changed)).not.toBe(quoteEditFingerprint(original))
  })

  it('detects clears, service changes and added/removed items', () => {
    for (const mutate of [
      (form: QuoteEditForm) => { form.notes = '' },
      (form: QuoteEditForm) => { form.valid_until = '' },
      (form: QuoteEditForm) => { form.items[0].service_id = 'another' },
      (form: QuoteEditForm) => { form.items[0].quantity = '' },
      (form: QuoteEditForm) => { form.items.push({ ...form.items[0] }) },
      (form: QuoteEditForm) => { form.items = [] },
    ]) {
      const form = makeForm()
      mutate(form)
      expect(quoteEditFingerprint(form)).not.toBe(quoteEditFingerprint(makeForm()))
    }
  })
})

describe('decimal validation and PostgreSQL-compatible rounding', () => {
  it('avoids binary-float precision checks and rounds each line before summing', () => {
    expect(decimalUnits('0.29', 2)).toBe(29n)
    expect(decimalUnits('1.005', 2)).toBeNull()
    const form = makeForm()
    form.items = Array.from({ length: 3 }, () => ({ ...form.items[0], quantity: '0.5', unit_price: '0.01' }))
    expect(lineCents(form.items[0])).toBe(1n)
    expect(validateQuoteEdit(form)).toMatchObject({ valid: true, subtotal: 3n, total: 3n })
    form.items[0] = { ...form.items[0], quantity: '1.005', unit_price: '1' }
    expect(lineCents(form.items[0])).toBe(101n)
  })

  it.each(['', '0', '-1', 'NaN', 'Infinity', '1e3', '1.0001', '10000000'])('rejects invalid quantity %s per row', (quantity) => {
    const form = makeForm()
    form.items[0].quantity = quantity
    const result = validateQuoteEdit(form)
    expect(result.valid).toBe(false)
    expect(result.errors.rows[0].quantity).toBeTruthy()
  })

  it.each(['', '0', '-1', 'NaN', 'Infinity', '0.001', '100000000'])('rejects invalid price %s per row', (price) => {
    const form = makeForm()
    form.items[0].unit_price = price
    expect(validateQuoteEdit(form).errors.rows[0].unit_price).toBeTruthy()
  })

  it('allows scale/max boundaries, rejects line and subtotal overflow', () => {
    const form = makeForm()
    form.items[0].quantity = '9999999.999'
    form.items[0].unit_price = '0.01'
    expect(validateQuoteEdit(form).valid).toBe(true)
    form.items[0].quantity = '1'
    form.items[0].unit_price = '99999999.99'
    expect(validateQuoteEdit(form).valid).toBe(true)
    form.items.push({ ...form.items[0] })
    expect(validateQuoteEdit(form).errors.items).toBeTruthy()
    form.items = [{ ...form.items[0], quantity: '2' }]
    expect(validateQuoteEdit(form).errors.rows[0].total).toBeTruthy()
  })

  it.each(['-1', '20', '0.001', 'NaN', 'Infinity'])('rejects invalid discount %s', (discount) => {
    const form = makeForm()
    form.discount = discount
    expect(validateQuoteEdit(form).errors.discount).toBeTruthy()
  })

  it('compares discount with rounded subtotal including a fully discounted quote', () => {
    const form = makeForm()
    form.discount = '19.99'
    expect(validateQuoteEdit(form)).toMatchObject({ valid: true, total: 0n })
  })

  it('validates missing items/service, existing company and invalid dates', () => {
    const form = makeForm()
    form.company_id = ''
    expect(validateQuoteEdit(form).valid).toBe(true)
    expect(validateQuoteEdit(form, 'original').errors.company_id).toBeTruthy()
    form.items[0].service_id = ''
    expect(validateQuoteEdit(form).errors.rows[0].service_id).toBeTruthy()
    form.items = []
    expect(validateQuoteEdit(form).errors.items).toBeTruthy()
    form.valid_until = '2026-02-30'
    expect(validateQuoteEdit(form).errors.valid_until).toBeTruthy()
    form.valid_until = ''
    expect(validateQuoteEdit(form).errors.valid_until).toBeUndefined()
  })
})

describe('date-only fields', () => {
  it('does not shift a calendar day through UTC timezone conversion', () => {
    expect(localDateValue('2026-11-09')).toBe('2026-11-09')
    expect(formatQuoteDate('2026-11-09')).toBe('09/11/2026')
    expect(formatQuoteDate('2026-12-20')).toBe('20/12/2026')
    expect(formatQuoteDate(null)).toBe('—')
  })
})
