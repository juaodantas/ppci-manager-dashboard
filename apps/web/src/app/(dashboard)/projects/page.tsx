'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '../../../presentation/components/ui/Button'
import { Input } from '../../../presentation/components/ui/Input'
import { Select } from '../../../presentation/components/ui/Select'
import { useProjects } from '../../../presentation/hooks/useProjects'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planejamento' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'finished', label: 'Concluído' },
  { value: 'finished_pending_payment', label: 'Concluído - Pagamento Pendente' },
  { value: 'canceled', label: 'Cancelado' },
]

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  finished: 'bg-green-100 text-green-700',
  finished_pending_payment: 'bg-amber-100 text-amber-700',
  canceled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planejamento',
  in_progress: 'Em andamento',
  finished: 'Concluído',
  finished_pending_payment: 'Concluído - Pagamento Pendente',
  canceled: 'Cancelado',
}

function ProjectsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawStatus = searchParams.get('status') ?? ''
  const rawSearch = searchParams.get('search') ?? ''
  const rawPage = Number(searchParams.get('page') ?? '1')
  const allowedStatuses = useMemo(() => new Set(STATUS_OPTIONS.map((option) => option.value)), [])
  const safeInitialStatus = allowedStatuses.has(rawStatus) ? rawStatus : ''
  const safeInitialPage = Number.isNaN(rawPage) ? 0 : Math.max(0, rawPage - 1)
  const [status, setStatus] = useState(safeInitialStatus)
  const [page, setPage] = useState(safeInitialPage)
  const [searchInput, setSearchInput] = useState(rawSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(rawSearch.trim())
  const customer_id = searchParams.get('customer_id') ?? undefined

  useEffect(() => {
    setStatus(allowedStatuses.has(rawStatus) ? rawStatus : '')
  }, [allowedStatuses, rawStatus])

  useEffect(() => {
    setSearchInput(rawSearch)
  }, [rawSearch])

  useEffect(() => {
    const nextPage = Number.isNaN(rawPage) ? 0 : Math.max(0, rawPage - 1)
    setPage(nextPage)
  }, [rawPage])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [searchInput])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (customer_id) {
      params.set('customer_id', customer_id)
    }
    if (status) {
      params.set('status', status)
    }
    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    }
    if (page > 0) {
      params.set('page', String(page + 1))
    }
    const value = params.toString()
    return value ? `?${value}` : ''
  }, [customer_id, debouncedSearch, page, status])

  useEffect(() => {
    const currentQuery = searchParams.toString()
    const currentQueryString = currentQuery ? `?${currentQuery}` : ''
    if (queryString === currentQueryString) return
    router.replace(`/projects${queryString}`)
  }, [queryString, router, searchParams])

  const { data, isLoading, isFetching } = useProjects({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: status || undefined,
    customer_id,
    search: debouncedSearch || undefined,
  })

  const projects = data?.projects ?? []
  const total = data?.total ?? 0
  const offset = page * PAGE_SIZE

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
        <Button onClick={() => router.push('/projects/new')}>Novo Projeto</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full max-w-md">
          <Input
            label="Buscar por nome"
            placeholder="Digite o nome do projeto…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-48">
          <Select
            label="Status"
            placeholder="Todos os status…"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0) }}
          />
        </div>
        {isFetching && (
          <span className="text-sm text-gray-400">Atualizando…</span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[920px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Início</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor Total</th>
              <th className="w-px whitespace-nowrap px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Carregando…</td>
              </tr>
            ) : (
              <>
                {projects.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">Nenhum projeto encontrado</td></tr>
                )}
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <Link
                        href={`/projects/${p.id}`}
                        className="block max-w-[320px] truncate text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        title={p.name}
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? ''}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {p.start_date ? new Date(p.start_date).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {p.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="w-px whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {!isLoading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="secondary" disabled={offset + PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Carregando…</div>}>
      <ProjectsContent />
    </Suspense>
  )
}
