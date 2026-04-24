'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../../presentation/components/ui/Button'
import { Input } from '../../../../presentation/components/ui/Input'
import { Select } from '../../../../presentation/components/ui/Select'
import { Modal } from '../../../../presentation/components/ui/Modal'
import { useCreateQuote } from '../../../../presentation/hooks/useQuotes'
import { useCustomers } from '../../../../presentation/hooks/useCustomers'
import { useServiceCatalog } from '../../../../presentation/hooks/useServiceCatalog'
import { useInternalCompanies, useCreateInternalCompany } from '../../../../presentation/hooks/useCompanies'
import type { QuoteItemDto } from '../../../../domain/repositories/quote.repository'
import { getApiErrorMessage } from '../../../../presentation/utils/api-error'

export default function NewQuotePage() {
  const router = useRouter()
  const create = useCreateQuote()
  const { data: customersData } = useCustomers({ limit: 200 })
  const { data: catalog } = useServiceCatalog()
  const { data: companiesData } = useInternalCompanies()
  const createInternalCompany = useCreateInternalCompany()

  const [customerId, setCustomerId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<QuoteItemDto[]>([{ service_id: '', quantity: 1, unit_price: 0 }])
  const [inlineCompanyModalOpen, setInlineCompanyModalOpen] = useState(false)
  const [inlineCompanyName, setInlineCompanyName] = useState('')
  const [inlineCompanyCnpj, setInlineCompanyCnpj] = useState('')
  const [inlineCompanyResponsible, setInlineCompanyResponsible] = useState('')
  const [inlineCompanyError, setInlineCompanyError] = useState('')

  const customers = customersData?.customers ?? []
  const services = catalog ?? []

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }))
  const serviceOptions = services.map((s) => ({ value: s.id, label: `${s.name} (${s.category.name})` }))
  const companyOptions = (companiesData?.companies ?? []).map((c) => ({ value: c.id, label: c.name }))

  const addItem = () => setItems((prev) => [...prev, { service_id: '', quantity: 1, unit_price: 0 }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof QuoteItemDto, value: string | number) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const discountNum = parseFloat(discount) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const quote = await create.mutateAsync({
      customer_id: customerId,
      company_id: companyId,
      valid_until: validUntil || undefined,
      discount: discountNum || undefined,
      notes: notes || undefined,
      items: items.filter((i) => i.service_id),
    })
    router.push(`/quotes/${quote.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/quotes"><Button variant="ghost" size="sm">← Voltar</Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Orçamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
        <Select
          label="Cliente *"
          options={customerOptions}
          placeholder="Selecione um cliente"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          required
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
              <Select
                label="Empresa executora *"
                options={companyOptions}
                placeholder="Selecione uma empresa executora"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setInlineCompanyModalOpen(true)} style={{ marginBottom: '1px' }}>+ Criar</Button>
        </div>
          <Input label="Validade" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          <Input label="Desconto (R$)" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <Input label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-gray-900">Itens</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Adicionar Item</Button>
          </div>
          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    label="Serviço"
                    options={serviceOptions}
                    placeholder="Selecione..."
                    value={item.service_id}
                    onChange={(e) => {
                      const svc = services.find((s) => s.id === e.target.value)
                      updateItem(i, 'service_id', e.target.value)
                      if (svc?.current_price) updateItem(i, 'unit_price', svc.current_price.price_per_unit)
                    }}
                  />
                </div>
                <div className="w-24">
                  <Input
                    label="Qtd"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="w-32">
                  <Input
                    label="Preço unit."
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="w-28 pb-0.5 text-right text-sm font-medium text-gray-700">
                  {(item.quantity * item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <Button type="button" variant="danger" size="sm" onClick={() => removeItem(i)} disabled={items.length === 1}>✕</Button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-8 text-sm">
            <span className="text-gray-500">Subtotal: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            {discountNum > 0 && <span className="text-red-600">- {discountNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
            <span className="font-bold text-gray-900">Total: {(total - discountNum).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/quotes"><Button type="button" variant="secondary">Cancelar</Button></Link>
          <Button type="submit" loading={create.isPending} disabled={!customerId || !companyId}>Criar Orçamento</Button>
        </div>
      </form>

      <Modal
        open={inlineCompanyModalOpen}
        title="Nova Empresa Interna"
        onClose={() => {
          setInlineCompanyModalOpen(false)
          setInlineCompanyError('')
        }}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setInlineCompanyError('')
            try {
              const result = await createInternalCompany.mutateAsync({
                name: inlineCompanyName,
                cnpj: inlineCompanyCnpj,
                responsible: inlineCompanyResponsible,
              })
              setCompanyId(result.id)
              setInlineCompanyModalOpen(false)
              setInlineCompanyName('')
              setInlineCompanyCnpj('')
              setInlineCompanyResponsible('')
              setInlineCompanyError('')
            } catch (err: unknown) {
              setInlineCompanyError(getApiErrorMessage(err, 'Não foi possível criar a empresa.'))
            }
          }}
          className="flex flex-col gap-4"
        >
          {inlineCompanyError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {inlineCompanyError}
            </div>
          )}
          <Input label="Nome *" value={inlineCompanyName} onChange={(e) => setInlineCompanyName(e.target.value)} required />
          <Input label="CNPJ *" value={inlineCompanyCnpj} onChange={(e) => setInlineCompanyCnpj(e.target.value)} placeholder="00.000.000/0000-00" required />
          <Input label="Responsável *" value={inlineCompanyResponsible} onChange={(e) => setInlineCompanyResponsible(e.target.value)} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setInlineCompanyModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createInternalCompany.isPending}>Criar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
