'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '../../../presentation/components/ui/Button'
import { Select } from '../../../presentation/components/ui/Select'
import { useQuotes, useDeleteQuote } from '../../../presentation/hooks/useQuotes'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'sent', label: 'Enviado' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

function QuotesContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)

  const customer_id = searchParams.get('customer_id') ?? undefined

  const { data, isLoading } = useQuotes({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: status || undefined,
    customer_id,
  })

  const del = useDeleteQuote()

  const quotes = data?.quotes ?? []
  const total = data?.total ?? 0
  const offset = page * PAGE_SIZE

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma a exclusão do orçamento?')) return
    await del.mutateAsync(id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
        <Link href="/quotes/new">
          <Button>Novo Orçamento</Button>
        </Link>
      </div>

      <div className="w-48">
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0) }}
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Carregando...</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Validade</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotes.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">Nenhum orçamento encontrado</td></tr>
                )}
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link href={`/quotes/${q.id}`} className="text-blue-600 hover:underline">
                        {new Date(q.created_at).toLocaleDateString('pt-BR')}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[q.status] ?? ''}`}>
                        {STATUS_LABELS[q.status] ?? q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {q.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/quotes/${q.id}`}>
                          <Button size="sm" variant="secondary">Ver</Button>
                        </Link>
                        {q.status === 'draft' && (
                          <Button size="sm" variant="danger" onClick={() => handleDelete(q.id)}>Excluir</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total}</span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="secondary" disabled={offset + PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function QuotesPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Carregando...</div>}>
      <QuotesContent />
    </Suspense>
  )
}
