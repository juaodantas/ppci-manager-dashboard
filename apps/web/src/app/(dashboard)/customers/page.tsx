'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Customer } from '@manager/domain'
import { Button } from '../../../presentation/components/ui/Button'
import { Modal } from '../../../presentation/components/ui/Modal'
import { Input } from '../../../presentation/components/ui/Input'
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
      <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Input label="CPF/CNPJ" value={document} onChange={(e) => setDocument(e.target.value)} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}

export default function CustomersPage() {
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | undefined>()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [searchInput])

  const { data, isLoading } = useCustomers({
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

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma a exclusão do cliente?')) return
    await del.mutateAsync(id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button onClick={() => setModalOpen(true)}>Novo Cliente</Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Carregando...</div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-4">
            <div className="w-full max-w-md">
              <Input
                label="Buscar por nome"
                placeholder="Digite o nome do cliente"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setPage(0)
                }}
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">CPF/CNPJ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">Nenhum cliente encontrado</td>
                  </tr>
                )}
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline">{c.name}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.email ?? c.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.document ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditing(c); setModalOpen(true) }}>Editar</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>Excluir</Button>
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
    </div>
  )
}
