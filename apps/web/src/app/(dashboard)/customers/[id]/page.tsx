'use client'

import { use } from 'react'
import Link from 'next/link'
import { useCustomer } from '../../../../presentation/hooks/useCustomers'
import { Button } from '../../../../presentation/components/ui/Button'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: customer, isLoading } = useCustomer(id)

  if (isLoading) return <div className="py-12 text-center text-gray-500">Carregando...</div>
  if (!customer) return <div className="py-12 text-center text-gray-500">Cliente não encontrado</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="sm">← Voltar</Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">E-mail</p>
          <p className="mt-1 text-sm text-gray-900">{customer.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Telefone</p>
          <p className="mt-1 text-sm text-gray-900">{customer.phone ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">CPF/CNPJ</p>
          <p className="mt-1 text-sm text-gray-900">{customer.document ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Orçamentos / Projetos</p>
          <p className="mt-1 text-sm text-gray-900">{customer.quote_count} orçamentos · {customer.project_count} projetos</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href={`/quotes?customer_id=${id}`}>
          <Button variant="secondary">Ver Orçamentos</Button>
        </Link>
        <Link href={`/projects?customer_id=${id}`}>
          <Button variant="secondary">Ver Projetos</Button>
        </Link>
      </div>
    </div>
  )
}
