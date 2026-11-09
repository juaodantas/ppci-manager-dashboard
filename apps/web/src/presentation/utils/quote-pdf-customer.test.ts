import { describe, expect, it } from 'vitest'
import { getQuotePDFCustomer } from './quote-pdf-customer'

const settled = { isPending: false, isFetching: false, isError: false }
const customer = { name: '  Cliente Exemplo  ', document: '  123.456.789-00  ' }

describe('quote PDF customer readiness', () => {
  it('blocks download while the customer is pending or being refreshed', () => {
    expect(getQuotePDFCustomer({ ...settled, isPending: true })).toEqual({ status: 'pending' })
    expect(getQuotePDFCustomer({ ...settled, isFetching: true, data: customer })).toEqual({ status: 'pending' })
  })

  it('blocks download on failure, even with cached customer data', () => {
    expect(getQuotePDFCustomer({ ...settled, isError: true })).toEqual({ status: 'unavailable' })
    expect(getQuotePDFCustomer({ ...settled, isError: true, data: customer })).toEqual({ status: 'unavailable' })
  })

  it('blocks unavailable customers and blank names without substituting an ID', () => {
    for (const data of [undefined, null, { name: '' }, { name: '   ' }]) {
      expect(getQuotePDFCustomer({ ...settled, data })).toEqual({ status: 'unavailable' })
    }
  })

  it('provides only the resolved name and optional document on success', () => {
    expect(getQuotePDFCustomer({ ...settled, data: customer })).toEqual({
      status: 'ready', name: 'Cliente Exemplo', document: '123.456.789-00',
    })
  })

  it('allows download without a document', () => {
    for (const document of [undefined, '', '  ']) {
      expect(getQuotePDFCustomer({ ...settled, data: { name: 'Cliente Exemplo', document } })).toEqual({
        status: 'ready', name: 'Cliente Exemplo', document: undefined,
      })
    }
  })
})
