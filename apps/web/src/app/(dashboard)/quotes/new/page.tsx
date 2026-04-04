'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../../presentation/components/ui/Button'
import { Input } from '../../../../presentation/components/ui/Input'
import { Select } from '../../../../presentation/components/ui/Select'
import { useCreateQuote } from '../../../../presentation/hooks/useQuotes'
import { useCustomers } from '../../../../presentation/hooks/useCustomers'
import { useServiceCatalog } from '../../../../presentation/hooks/useServiceCatalog'
import type { QuoteItemDto } from '../../../../domain/repositories/quote.repository'

export default function NewQuotePage() {
  const router = useRouter()
  const create = useCreateQuote()
  const { data: customersData } = useCustomers({ limit: 200 })
  const { data: catalog } = useServiceCatalog()

  const [customerId, setCustomerId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<QuoteItemDto[]>([{ service_id: '', quantity: 1, unit_price: 0 }])

  const customers = customersData?.customers ?? []
  const services = catalog ?? []

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }))
  const serviceOptions = services.map((s) => ({ value: s.id, label: `${s.name} (${s.category.name})` }))

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
          <Button type="submit" loading={create.isPending} disabled={!customerId}>Criar Orçamento</Button>
        </div>
      </form>
    </div>
  )
}
