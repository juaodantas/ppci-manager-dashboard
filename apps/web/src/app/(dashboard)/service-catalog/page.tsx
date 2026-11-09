'use client'

import { useRef, useState } from 'react'
import { ServiceCatalogForm } from '../../../presentation/components/ServiceCatalogForm'
import type { ServiceCatalogWithCategory } from '@manager/domain'
import { Button } from '../../../presentation/components/ui/Button'
import { Modal } from '../../../presentation/components/ui/Modal'
import { Input } from '../../../presentation/components/ui/Input'
import {
  useServiceCatalog,
  useServiceCategories,
  useCreateServiceCatalog,
  useUpdateServiceCatalog,
  useDeactivateService,
  useAddServicePrice,
} from '../../../presentation/hooks/useServiceCatalog'
import type {
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
  AddServicePriceDto,
} from '../../../domain/repositories/service-catalog.repository'

export default function ServiceCatalogPage() {
  const [includeInactive, setIncludeInactive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceCatalogWithCategory | undefined>()
  const [pricingService, setPricingService] = useState<ServiceCatalogWithCategory | undefined>()
  const [newPrice, setNewPrice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submitting = useRef(false)

  const { data: services, isLoading, isError: servicesError, refetch: refetchServices, isFetching: servicesFetching } = useServiceCatalog(includeInactive)
  const { data: categories, isPending: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useServiceCategories()
  const create = useCreateServiceCatalog()
  const update = useUpdateServiceCatalog()
  const deactivate = useDeactivateService()
  const addPrice = useAddServicePrice()

  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }))

  // Group by category
  const grouped = (services ?? []).reduce<Record<string, ServiceCatalogWithCategory[]>>((acc, s) => {
    const cat = s.category.name
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const handleSubmit = async (dto: CreateServiceCatalogDto | UpdateServiceCatalogDto) => {
    if (submitting.current) return
    submitting.current = true
    setSubmitError(null)
    try {
      if (editing) {
        const { name, description, unit_type } = dto
        await update.mutateAsync({ id: editing.id, dto: { name, description, unit_type } })
      } else {
        await create.mutateAsync(dto as CreateServiceCatalogDto)
      }
      setModalOpen(false); setEditing(undefined)
    } catch {
      setSubmitError('Não foi possível salvar o serviço. Seus dados foram mantidos. Tente novamente.')
    } finally {
      submitting.current = false
    }
  }

  const closeServiceModal = () => {
    if (submitting.current) return
    setModalOpen(false); setEditing(undefined); setSubmitError(null)
  }

  const handleAddPrice = async () => {
    if (!pricingService) return
    const dto: AddServicePriceDto = { price_per_unit: parseFloat(newPrice), minimum_price: minPrice ? parseFloat(minPrice) : undefined }
    await addPrice.mutateAsync({ serviceId: pricingService.id, dto })
    setPriceModalOpen(false); setNewPrice(''); setMinPrice('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Serviços</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="rounded" />
            Incluir inativos
          </label>
          <Button onClick={() => { setEditing(undefined); setSubmitError(null); setModalOpen(true) }}>+ Novo Serviço</Button>
        </div>
      </div>

      {isLoading ? (
        <div role="status" className="py-12 text-center text-gray-500">Carregando...</div>
      ) : servicesError ? (
        <div role="alert" className="py-12 text-center text-red-600">
          Não foi possível carregar o catálogo de serviços.
          <Button variant="secondary" onClick={() => { void refetchServices() }} disabled={servicesFetching}>Tentar novamente</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b bg-gray-50 px-6 py-3">
                <h2 className="font-medium text-gray-900">{cat} <span className="text-xs text-gray-400">({items.length})</span></h2>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Serviço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Unidade</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Preço vigente</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((svc) => (
                    <tr key={svc.id} className={svc.is_active ? '' : 'opacity-50'}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {svc.name}
                        {!svc.is_active && <span className="ml-2 text-xs text-gray-400">(inativo)</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{svc.unit_type ?? '—'}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {svc.current_price ? svc.current_price.price_per_unit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => { setEditing(svc); setSubmitError(null); setModalOpen(true) }}>Editar</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setPricingService(svc); setNewPrice(String(svc.current_price?.price_per_unit ?? '')); setPriceModalOpen(true) }}>Preço</Button>
                          {svc.is_active && (
                            <Button size="sm" variant="danger" onClick={() => deactivate.mutateAsync(svc.id)}>Desativar</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="py-12 text-center text-gray-400">Nenhum serviço no catálogo</div>
          )}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Editar Serviço' : 'Novo Serviço'} onClose={closeServiceModal} closeDisabled={create.isPending || update.isPending}>
        <ServiceCatalogForm
          initial={editing}
          categories={categoryOptions}
          onSubmit={handleSubmit}
          onCancel={closeServiceModal}
          loading={create.isPending || update.isPending}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          retryCategories={() => { void refetchCategories() }}
          submitError={submitError}
        />
      </Modal>

      <Modal open={priceModalOpen} title={`Atualizar Preço — ${pricingService?.name}`} onClose={() => setPriceModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <Input label="Preço por unidade (R$) *" type="number" min="0" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
          <Input label="Preço mínimo (R$)" type="number" min="0" step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPriceModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddPrice} loading={addPrice.isPending} disabled={!newPrice}>Salvar Preço</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
