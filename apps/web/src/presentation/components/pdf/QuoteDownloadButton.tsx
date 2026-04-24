'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { QuotePDF } from './quote-pdf'
import type { Quote, QuoteItem } from '@manager/domain'
import type { ServiceNameById } from '../../utils/service-label'

interface Props {
  quote: Quote & { items: QuoteItem[] }
  customerName: string
  companyName?: string
  companyCnpj?: string
  serviceNameById?: ServiceNameById
}

export function QuoteDownloadButton({ quote, customerName, companyName, companyCnpj, serviceNameById }: Props) {
  const filename = `orcamento-${quote.id.slice(0, 8)}.pdf`

  return (
    <PDFDownloadLink
      document={(
        <QuotePDF
          quote={quote}
          customerName={customerName}
          companyName={companyName}
          companyCnpj={companyCnpj}
          serviceNameById={serviceNameById}
        />
      )}
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Gerando PDF…' : 'Exportar PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
