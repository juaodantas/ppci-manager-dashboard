'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useQuote, useApproveQuote } from '../../../../presentation/hooks/useQuotes'
import { useCustomer } from '../../../../presentation/hooks/useCustomers'
import { useServiceCatalog } from '../../../../presentation/hooks/useServiceCatalog'
import { useInternalCompanies } from '../../../../presentation/hooks/useCompanies'
import { Button } from '../../../../presentation/components/ui/Button'
import { Modal } from '../../../../presentation/components/ui/Modal'
import { Input } from '../../../../presentation/components/ui/Input'
import type { QuoteItem } from '@manager/domain'
import { getQuoteItemLabel, type ServiceNameById } from '../../../../presentation/utils/service-label'
import { getQuotePDFCustomer } from '../../../../presentation/utils/quote-pdf-customer'
import { formatQuoteDate, formatQuoteMoney } from '../../../../presentation/utils/quote-edit'

const QuoteDownloadButton = dynamic(
  () => import('../../../../presentation/components/pdf/QuoteDownloadButton').then((m) => m.QuoteDownloadButton),
  { ssr: false, loading: () => <button className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-500">PDF…</button> },
)

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado', rejected: 'Rejeitado',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: quote, isLoading } = useQuote(id)
  const customerQuery = useCustomer(quote?.customer_id ?? '')
  const { data: catalog } = useServiceCatalog()
  const { data: internalCompanies } = useInternalCompanies()
  const approve = useApproveQuote()
  const [approveOpen, setApproveOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('updated') === '1') {
      setUpdated(true)
      url.searchParams.delete('updated')
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    }
  }, [id])

  if (isLoading) return <div className="py-12 text-center text-gray-500">Carregando...</div>
  if (!quote) return <div className="py-12 text-center text-gray-500">Orçamento não encontrado</div>

  const pdfCustomer = getQuotePDFCustomer(customerQuery)
  const hasItems = (quote.items ?? []).length > 0
  const company = (internalCompanies?.companies ?? []).find((entry) => entry.id === quote.company_id)
  const serviceNameById = (catalog ?? []).reduce<ServiceNameById>((acc, service) => {
    acc[service.id] = service.name
    return acc
  }, {})

  const handleApprove = async () => {
    const result = await approve.mutateAsync({ id, dto: { name: projectName, start_date: startDate || undefined } })
    router.push(`/projects/${result.project_id}`)
  }

  const canApprove = quote.status === 'draft' || quote.status === 'sent'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/quotes"><Button variant="ghost" size="sm">← Voltar</Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">Orçamento</h1>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[quote.status] ?? ''}`}>
          {STATUS_LABELS[quote.status] ?? quote.status}
        </span>
        {canApprove && (
          <Link href={`/quotes/${id}/edit`}><Button variant="secondary">Editar</Button></Link>
        )}
        {canApprove && (
          <Button onClick={() => { setProjectName(''); setApproveOpen(true) }}>Aprovar → Projeto</Button>
        )}
        {hasItems && (
          !company ? (
            <Button variant="secondary" size="sm" disabled>
              Defina a empresa executora para gerar o documento
            </Button>
          ) : pdfCustomer.status === 'pending' ? (
            <Button variant="secondary" size="sm" disabled loading loadingText="Carregando cliente para gerar PDF">
              Carregando cliente…
            </Button>
          ) : pdfCustomer.status === 'unavailable' ? (
            <div className="flex flex-wrap items-center gap-2">
              <p role="alert" className="text-sm text-red-600">
                Não foi possível obter um cliente com nome válido. O PDF está indisponível.
              </p>
              <Button variant="secondary" size="sm" onClick={() => void customerQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <QuoteDownloadButton
              key={JSON.stringify([quote, pdfCustomer, company, serviceNameById])}
              quote={quote as typeof quote & { items: QuoteItem[] }}
              customerName={pdfCustomer.name}
              customerDocument={pdfCustomer.document}
              companyName={company.name}
              companyCnpj={company.cnpj}
              serviceNameById={serviceNameById}
            />
          )
        )}
      </div>

      {updated && <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Orçamento atualizado com sucesso.</p>}

      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Data</p>
          <p className="mt-1 text-sm text-gray-900">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Validade</p>
          <p className="mt-1 text-sm text-gray-900">{formatQuoteDate(quote.valid_until)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Desconto</p>
          <p className="mt-1 text-sm text-gray-900">{quote.discount > 0 ? quote.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</p>
        </div>
        {quote.notes && (
          <div className="sm:col-span-3">
            <p className="text-xs font-medium uppercase text-gray-500">Observações</p>
            <p className="mt-1 text-sm text-gray-900">{quote.notes}</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-medium text-gray-900">Itens</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Serviço</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Qtd</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Preço unit.</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(quote.items ?? []).map((item, index) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{getQuoteItemLabel(item, index, serviceNameById)}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-700">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-700">{item.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{item.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t">
            <tr>
              <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-700">Subtotal</td>
              <td className="px-6 py-2 text-right text-sm text-gray-900">{formatQuoteMoney(quote.total_amount)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-700">Desconto</td>
              <td className="px-6 py-2 text-right text-sm text-gray-900">{formatQuoteMoney(quote.discount ?? 0)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">Total líquido</td>
              <td className="px-6 py-4 text-right text-base font-bold text-gray-900">
                {formatQuoteMoney(quote.total_amount - (quote.discount ?? 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Modal open={approveOpen} title="Aprovar Orçamento" onClose={() => setApproveOpen(false)}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Ao aprovar, um projeto será criado automaticamente com os itens deste orçamento.</p>
          <Input label="Nome do Projeto *" value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
          <Input label="Data de Início" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setApproveOpen(false)}>Cancelar</Button>
            <Button onClick={handleApprove} loading={approve.isPending} disabled={!projectName}>Aprovar e Criar Projeto</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
