'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '../../../presentation/components/ui/Button'
import { Input } from '../../../presentation/components/ui/Input'
import { Select } from '../../../presentation/components/ui/Select'
import { useProjects } from '../../../presentation/hooks/useProjects'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'planning', label: 'Planejamento' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'finished', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
]

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  finished: 'bg-green-100 text-green-700',
  canceled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planejamento', in_progress: 'Em andamento', finished: 'Concluído', canceled: 'Cancelado',
}

function ProjectsContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const customer_id = searchParams.get('customer_id') ?? undefined

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [searchInput])

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
        <Link href="/projects/new"><Button>Novo Projeto</Button></Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full max-w-md">
          <Input
            label="Buscar por nome"
            placeholder="Digite o nome do projeto"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-48">
          <Select options={STATUS_OPTIONS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} />
        </div>
        {isFetching && (
          <span className="text-sm text-gray-400">Atualizando...</span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Início</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Carregando...</td>
              </tr>
            ) : (
              <>
                {projects.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">Nenhum projeto encontrado</td></tr>
                )}
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link>
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
                    <td className="px-6 py-4 text-right">
                      <Link href={`/projects/${p.id}`}><Button size="sm" variant="secondary">Ver</Button></Link>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
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
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Carregando...</div>}>
      <ProjectsContent />
    </Suspense>
  )
}
