'use client'

import { useState } from 'react'
import type { ServiceCatalogWithCategory } from '@manager/domain'
import type { CreateServiceCatalogDto } from '../../domain/repositories/service-catalog.repository'
import { serviceCatalogFormSchema } from '../utils/service-catalog-form'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

export function ServiceCatalogForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  loading,
  categoriesLoading,
  categoriesError,
  retryCategories,
  submitError,
}: {
  initial?: ServiceCatalogWithCategory
  categories: { value: string; label: string }[]
  onSubmit: (dto: CreateServiceCatalogDto) => void
  onCancel: () => void
  loading: boolean
  categoriesLoading: boolean
  categoriesError: boolean
  retryCategories: () => void
  submitError: string | null
}) {
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [unitType, setUnitType] = useState(initial?.unit_type ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const categoriesUnavailable = !initial && (categoriesLoading || categoriesError || categories.length === 0)

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      if (loading || categoriesUnavailable) return
      const result = serviceCatalogFormSchema.safeParse({
        category_id: categoryId,
        name,
        description: initial ? description : description || undefined,
        unit_type: initial ? unitType : unitType || undefined,
      })
      if (!result.success) {
        setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message])))
        return
      }
      setErrors({})
      onSubmit(result.data)
    }} className="flex flex-col gap-4" aria-busy={loading}>
      {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
      {!initial && (categoriesLoading ? <p role="status" className="text-sm text-gray-500">Carregando categorias...</p>
        : categoriesError ? <div role="alert" className="text-sm text-red-600">
          Não foi possível carregar as categorias.
          <Button type="button" variant="secondary" onClick={retryCategories} disabled={loading}>Tentar novamente</Button>
        </div>
        : categories.length === 0 && <p role="status" className="text-sm text-gray-500">Nenhuma categoria disponível. Cadastre uma categoria antes de salvar um serviço.</p>)}
      <Select label="Categoria *" options={initial ? [{ value: initial.category_id, label: initial.category.name }] : categories} placeholder="Selecione..." value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={!!initial || loading || categoriesUnavailable} error={errors.category_id} description={initial ? 'A categoria não pode ser alterada na edição.' : undefined} />
      <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} disabled={loading} error={errors.name} />
      <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
      <Input label="Unidade (ex: m², horas, unidade)" value={unitType} onChange={(e) => setUnitType(e.target.value)} maxLength={50} disabled={loading} error={errors.unit_type} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" loading={loading} disabled={categoriesUnavailable}>Salvar</Button>
      </div>
    </form>
  )
}
