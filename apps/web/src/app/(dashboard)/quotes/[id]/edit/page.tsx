'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Quote } from '@manager/domain'
import { Button } from '../../../../../presentation/components/ui/Button'
import { Input } from '../../../../../presentation/components/ui/Input'
import { Select } from '../../../../../presentation/components/ui/Select'
import { useQuote, useUpdateQuote } from '../../../../../presentation/hooks/useQuotes'
import { useCustomer } from '../../../../../presentation/hooks/useCustomers'
import { useInternalCompanies } from '../../../../../presentation/hooks/useCompanies'
import { useServiceCatalog } from '../../../../../presentation/hooks/useServiceCatalog'
import { getApiErrorMessage } from '../../../../../presentation/utils/api-error'
import { editorLinkDecision, shouldGuardEditorUnload } from '../../../../../presentation/utils/quote-edit-navigation'
import {
  formatQuoteMoney, lineCents, quoteEditDto, quoteEditFingerprint, quoteToEditForm, validateQuoteEdit,
  type QuoteEditForm, type QuoteEditItem,
} from '../../../../../presentation/utils/quote-edit'

export default function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const query = useQuote(id)
  if (query.isLoading) return <p className="py-12 text-center">Carregando orçamento...</p>
  if (!query.data) return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <p>{getApiErrorMessage(query.error, 'Orçamento não encontrado.')}</p>
      <Button variant="secondary" onClick={() => void query.refetch()}>Tentar novamente</Button>
    </div>
  )
  // A keyed editor owns one snapshot per id. Catalog/detail refetches never hydrate it again.
  return <QuoteEditor key={id} quote={query.data} />
}

function QuoteEditor({ quote }: { quote: Quote }) {
  const router = useRouter()
  const update = useUpdateQuote()
  const customer = useCustomer(quote.customer_id)
  const { data: companies } = useInternalCompanies()
  const { data: catalog } = useServiceCatalog()
  const [snapshot] = useState(() => quoteToEditForm(quote))
  const [form, setForm] = useState<QuoteEditForm>(snapshot)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const submitting = useRef(false)
  const saveCompleted = useRef(false)
  const [navigationNotice, setNavigationNotice] = useState('')
  const canEdit = quote.status === 'draft' || quote.status === 'sent'
  const dirty = !saved && quoteEditFingerprint(form) !== quoteEditFingerprint(snapshot)
  const validation = validateQuoteEdit(form, snapshot.company_id)
  const errors = submitted ? validation.errors : undefined
  const locked = update.isPending || saved || !canEdit

  useEffect(() => {
    // Read synchronous submission refs: capture can run before React commits pending/saved.
    let skipConfirmedUnload = false
    let resetUnload: ReturnType<typeof setTimeout> | undefined
    const state = () => ({ dirty, pending: submitting.current, saved: saveCompleted.current })
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (skipConfirmedUnload || !shouldGuardEditorUnload(state())) return
      event.preventDefault()
      event.returnValue = ''
    }
    const captureLink = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(anchor instanceof HTMLAnchorElement)) return
      const decision = editorLinkDecision(state(), {
        href: anchor.href, currentHref: window.location.href, target: anchor.target,
        download: anchor.hasAttribute('download'), button: event.button,
        modified: event.ctrlKey || event.metaKey || event.shiftKey || event.altKey,
        defaultPrevented: event.defaultPrevented,
      })
      if (decision === 'allow') return
      if (decision === 'block' || !window.confirm('Descartar as alterações deste orçamento?')) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (decision === 'block') setNavigationNotice('Aguarde o orçamento terminar de salvar antes de sair.')
        return
      }
      // A regular same-origin anchor may unload rather than use Next Link.
      // Its confirmed click must not immediately produce a second native prompt.
      skipConfirmedUnload = true
      resetUnload = setTimeout(() => { skipConfirmedUnload = false }, 0)
    }
    document.addEventListener('click', captureLink, true)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      document.removeEventListener('click', captureLink, true)
      window.removeEventListener('beforeunload', beforeUnload)
      clearTimeout(resetUnload)
    }
  }, [dirty])

  const leave = () => {
    if (submitting.current || saved) return
    if (!dirty || window.confirm('Descartar as alterações deste orçamento?')) router.push(`/quotes/${quote.id}`)
  }
  const setField = <K extends keyof QuoteEditForm>(key: K, value: QuoteEditForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }
  const setItem = (index: number, changes: Partial<QuoteEditItem>) => {
    setForm((current) => ({ ...current, items: current.items.map((item, i) => i === index ? { ...item, ...changes } : item) }))
  }
  const companyOptions = (companies?.companies ?? []).map((company) => ({ value: company.id, label: company.name }))
  if (form.company_id && !companyOptions.some((option) => option.value === form.company_id)) {
    companyOptions.unshift({ value: form.company_id, label: `Empresa atual (${form.company_id})` })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting.current || saved || !canEdit) return
    setSubmitted(true)
    setError('')
    if (!validation.valid) return
    setNavigationNotice('')
    submitting.current = true
    try {
      await update.mutateAsync({ id: quote.id, dto: quoteEditDto(form) })
      saveCompleted.current = true
      setSaved(true)
      router.push(`/quotes/${quote.id}?updated=1`)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Não foi possível salvar o orçamento. Tente novamente.'))
    } finally {
      submitting.current = false
      setNavigationNotice('')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" onClick={leave} disabled={update.isPending || saved}>← Voltar</Button>
        <h1 className="text-2xl font-bold text-gray-900">Editar orçamento</h1>
      </div>
      {!canEdit && <p role="alert" className="text-red-700">Somente orçamentos em rascunho ou enviados podem ser editados.</p>}
      <p role="status" aria-live="polite" className={navigationNotice ? 'text-sm text-gray-700' : 'sr-only'}>{navigationNotice}</p>
      <form noValidate onSubmit={submit} className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6" aria-busy={update.isPending}>
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {submitted && !validation.valid && <p role="alert" className="text-sm text-red-700">Revise os campos indicados antes de salvar.</p>}
        <fieldset disabled={locked} className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="quote-customer" label="Cliente (não pode ser alterado)" readOnly value={customer.data?.name ?? quote.customer_id} />
            <Select id="quote-company" label="Empresa executora" value={form.company_id}
              options={companyOptions} placeholder={!form.company_id ? 'Sem empresa — manter ou selecionar' : undefined}
              onChange={(event) => setField('company_id', event.target.value)} error={errors?.company_id} />
            <Input id="quote-valid-until" label="Validade" type="date" value={form.valid_until} onChange={(event) => setField('valid_until', event.target.value)} error={errors?.valid_until} />
            <Input id="quote-discount" label="Desconto (R$)" type="number" min="0" step="0.01" value={form.discount} onChange={(event) => setField('discount', event.target.value)} error={errors?.discount} />
            <div className="sm:col-span-2">
              <Input id="quote-notes" label="Observações" value={form.notes} onChange={(event) => setField('notes', event.target.value)} />
            </div>
          </div>
          <section aria-labelledby="quote-items-heading" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="quote-items-heading" className="font-medium text-gray-900">Itens</h2>
              <Button type="button" variant="secondary" size="sm" onClick={() => setField('items', [...form.items, { service_id: '', description: '', quantity: '1', unit_price: '' }])}>+ Adicionar item</Button>
            </div>
            {errors?.items && <p role="alert" className="text-sm text-red-700">{errors.items}</p>}
            {form.items.map((item, index) => {
              const options = (catalog ?? []).map((service) => ({ value: service.id, label: service.name }))
              if (item.service_id && !options.some((option) => option.value === item.service_id)) {
                options.unshift({ value: item.service_id, label: `${item.description || item.service_id} (fora do catálogo ativo)` })
              }
              const row = errors?.rows[index]
              const cents = lineCents(item)
              return (
                <fieldset key={index} className="min-w-0 rounded-md border border-gray-200 p-4">
                  <legend className="px-1 text-sm font-medium text-gray-700">Item {index + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Select id={`item-${index}-service`} label="Serviço" value={item.service_id} options={options} placeholder="Selecione um serviço"
                        error={row?.service_id} onChange={(event) => {
                          const service = catalog?.find((entry) => entry.id === event.target.value)
                          setItem(index, { service_id: event.target.value,
                            ...(service ? { description: service.name, ...(service.current_price ? { unit_price: String(service.current_price.price_per_unit) } : {}) } : {}),
                          })
                        }} />
                    </div>
                    <Input id={`item-${index}-quantity`} label="Quantidade" type="number" min="0.001" step="0.001" value={item.quantity} error={row?.quantity} onChange={(event) => setItem(index, { quantity: event.target.value })} />
                    <Input id={`item-${index}-price`} label="Preço unitário (R$)" type="number" min="0.01" step="0.01" value={item.unit_price} error={row?.unit_price} onChange={(event) => setItem(index, { unit_price: event.target.value })} />
                    <div className="sm:col-span-2 lg:col-span-4">
                      <Input id={`item-${index}-description`} label="Descrição" value={item.description} onChange={(event) => setItem(index, { description: event.target.value })} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-gray-700">Total do item: {cents === null ? '—' : formatQuoteMoney(Number(cents) / 100)}</p>
                    <Button type="button" variant="danger" size="sm" aria-label={`Remover item ${index + 1}`} disabled={form.items.length <= 1} onClick={() => setField('items', form.items.filter((_, i) => i !== index))}>Remover</Button>
                  </div>
                  {row?.total && <p role="alert" className="text-sm text-red-700">{row.total}</p>}
                </fieldset>
              )
            })}
          </section>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-x-8 gap-y-2 text-sm" aria-live="polite">
          <span>Subtotal: {formatQuoteMoney(Number(validation.subtotal) / 100)}</span>
          <span>Desconto: {formatQuoteMoney(Number(validation.discount) / 100)}</span>
          <strong>Total líquido: {formatQuoteMoney(Number(validation.total) / 100)}</strong>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={leave} disabled={update.isPending || saved}>Cancelar</Button>
          <Button type="submit" loading={update.isPending} disabled={locked}>Salvar alterações</Button>
        </div>
      </form>
    </div>
  )
}
