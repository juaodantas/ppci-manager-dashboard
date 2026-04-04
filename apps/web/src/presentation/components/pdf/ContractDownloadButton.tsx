'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { ContractPDF } from './contract-pdf'
import type { Project, ProjectService, Payment } from '@manager/domain'

interface Props {
  project: Project & { services: ProjectService[] }
  customerName: string
  payments: Payment[]
  companyName?: string
}

export function ContractDownloadButton({ project, customerName, payments, companyName }: Props) {
  const filename = `contrato-${project.name.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}.pdf`

  return (
    <PDFDownloadLink
      document={
        <ContractPDF
          project={project}
          customerName={customerName}
          payments={payments}
          companyName={companyName}
        />
      }
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Gerando PDF…' : 'Gerar Contrato PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
