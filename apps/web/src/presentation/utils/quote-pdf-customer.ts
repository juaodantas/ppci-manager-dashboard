type CustomerQuery = {
  data?: { name: string; document?: string } | null
  isPending: boolean
  isError: boolean
  isFetching: boolean
}

type QuotePDFCustomer =
  | { status: 'pending' }
  | { status: 'unavailable' }
  | { status: 'ready'; name: string; document?: string }

// Never substitute the customer ID for the recipient's name in a document.
export function getQuotePDFCustomer(query: CustomerQuery): QuotePDFCustomer {
  if (query.isPending || query.isFetching) return { status: 'pending' }
  const name = query.data?.name.trim()
  if (query.isError || !name) return { status: 'unavailable' }
  return { status: 'ready', name, document: query.data?.document?.trim() || undefined }
}
