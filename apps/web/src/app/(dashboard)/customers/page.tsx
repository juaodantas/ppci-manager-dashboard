'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Customer } from '@manager/domain'
import { Button } from '../../../presentation/components/ui/Button'
import { Modal } from '../../../presentation/components/ui/Modal'
import { Input } from '../../../presentation/components/ui/Input'
import { ConfirmDialog } from '../../../presentation/components/ui/ConfirmDialog'
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../../../presentation/hooks/useCustomers'
import type { CreateCustomerDto, UpdateCustomerDto } from '../../../domain/repositories/customer.repository'

const PAGE_SIZE = 20

function CustomerForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Customer
  onSubmit: (dto: CreateCustomerDto) => void
  onCancel: () => void
  loading: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [document, setDocument] = useState(initial?.document ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, email: email || undefined, phone: phone || undefined, document: document || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="ex: contato@empresa.com…"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Telefone"
        type="tel"
        autoComplete="tel"
        placeholder="ex: (11) 91234-5678…"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        label="CPF/CNPJ"
        placeholder="ex: 123.456.789-00…"
        value={document}
        onChange={(e) => setDocument(e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}

function CustomersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawSearch = searchParams.get('search') ?? ''
  const rawPage = Number(searchParams.get('page') ?? '1')
  const safeInitialPage = Number.isNaN(rawPage) ? 0 : Math.max(0, rawPage - 1)
  const [page, setPage] = useState(safeInitialPage)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | undefined>()
  const [searchInput, setSearchInput] = useState(rawSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(rawSearch.trim())
  const [deleteTarget, setDeleteTarget] = useState<Customer | undefined>()

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
    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    }
    if (page > 0) {
      params.set('page', String(page + 1))
    }
    const value = params.toString()
    return value ? `?${value}` : ''
  }, [debouncedSearch, page])

  useEffect(() => {
    const currentQuery = searchParams.toString()
    const currentQueryString = currentQuery ? `?${currentQuery}` : ''
    if (queryString === currentQueryString) return
    router.replace(`/customers${queryString}`)
  }, [queryString, router, searchParams])

  const { data, isLoading, isFetching } = useCustomers({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: debouncedSearch || undefined,
  })
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const del = useDeleteCustomer()

  const customers = data?.customers ?? []
  const total = data?.total ?? 0
  const offset = page * PAGE_SIZE

  const handleSubmit = async (dto: CreateCustomerDto | UpdateCustomerDto) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, dto: dto as UpdateCustomerDto })
    } else {
      await create.mutateAsync(dto as CreateCustomerDto)
    }
    setModalOpen(false)
    setEditing(undefined)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await del.mutateAsync(deleteTarget.id)
    setDeleteTarget(undefined)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button onClick={() => setModalOpen(true)}>Novo Cliente</Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-md">
          <Input
            label="Buscar por nome"
            placeholder="Digite o nome do cliente…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(0)
            }}
          />
        </div>
        {isFetching && (
          <span className="text-sm text-gray-400">Atualizando…</span>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contato</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">CPF/CNPJ</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">Carregando…</td>
              </tr>
            ) : (
              <>
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">Nenhum cliente encontrado</td>
                  </tr>
                )}
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <Link
                        href={`/customers/${c.id}`}
                        className="block max-w-[260px] truncate text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        title={c.name}
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="block max-w-[240px] truncate" title={c.email ?? c.phone ?? ''}>
                        {c.email ?? c.phone ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="block max-w-[200px] truncate" title={c.document ?? ''}>
                        {c.document ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditing(c); setModalOpen(true) }}>Editar</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(c)}>Excluir</Button>
                      </div>
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

      <Modal
        open={modalOpen}
        title={editing ? 'Editar Cliente' : 'Novo Cliente'}
        onClose={() => { setModalOpen(false); setEditing(undefined) }}
      >
        <CustomerForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(undefined) }}
          loading={create.isPending || update.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir cliente"
        description={deleteTarget ? `Deseja realmente excluir o cliente "${deleteTarget.name}"?` : undefined}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={del.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(undefined)}
      />
    </div>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Carregando…</div>}>
      <CustomersContent />
    </Suspense>
  )
}
