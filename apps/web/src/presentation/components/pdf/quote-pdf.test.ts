import { renderToBuffer } from '@react-pdf/renderer'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import type { Quote, QuoteItem, QuoteStatus } from '@manager/domain'
import { QuotePDF } from './quote-pdf'

const quote: Quote & { items: QuoteItem[] } = {
  id: 'quote-id',
  customer_id: 'a53e130d-8dca-40ec-a650-405781b573cb',
  status: 'draft',
  total_amount: 100,
  discount: 0,
  created_at: '2026-01-15T12:00:00Z',
  updated_at: '2026-01-15T12:00:00Z',
  items: [{ id: 'item-id', quote_id: 'quote-id', service_id: 'service-id', description: 'Servico', quantity: 1, unit_price: 100, total_price: 100 }],
}

// PDFKit emits standard Helvetica text as WinAnsi hex strings in compressed
// content streams. Read those strings so this tests the actual generated PDF,
// without a browser, renderer mocks, or a PDF parser dependency.
function pdfText(buffer: Buffer): string {
  const pdf = buffer.toString('latin1')
  return [...pdf.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map((match) => {
    const stream = inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1')
    return [...stream.matchAll(/<([0-9a-f]+)>/gi)]
      .map((text) => Buffer.from(text[1], 'hex').toString('latin1')).join('')
  }).join('')
}

describe('QuotePDF actual rendering', () => {
  it('prints the saved validity calendar date without timezone conversion', async () => {
    const text = pdfText(await renderToBuffer(QuotePDF({
      quote: { ...quote, valid_until: '2026-12-20' }, customerName: 'Cliente Exemplo',
    })))
    expect(text).toContain('Válido até: 20/12/2026')
    expect(text).not.toContain('19/12/2026')
  })

  it.each<QuoteStatus>(['draft', 'sent', 'approved', 'rejected'])('prints customer identity, but not status (%s)', async (status) => {
    const buffer = await renderToBuffer(QuotePDF({
      quote: { ...quote, status }, customerName: 'Cliente Exemplo', customerDocument: '123.456.789-00',
    }))
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
    const text = pdfText(buffer)
    expect(text).toContain('Cliente Exemplo')
    expect(text).toContain('CPF/CNPJ')
    expect(text).toContain('123.456.789-00')
    expect(text).not.toContain(quote.customer_id)
    for (const label of ['Status', 'Rascunho', 'Enviado', 'Aprovado', 'Rejeitado', status]) {
      expect(text).not.toContain(label)
    }
  })

  it('renders without CPF/CNPJ and never falls back to the customer UUID', async () => {
    const named = pdfText(await renderToBuffer(QuotePDF({ quote, customerName: 'Cliente Exemplo' })))
    expect(named).toContain('Cliente Exemplo')
    expect(named).not.toContain('CPF/CNPJ')
    const blank = pdfText(await renderToBuffer(QuotePDF({ quote, customerName: '  ' })))
    expect(blank).not.toContain(quote.customer_id)
  })
})
