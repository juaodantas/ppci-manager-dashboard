import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCreateServiceCatalog, useUpdateServiceCatalog } from './useServiceCatalog'

const persistence = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))
vi.mock('../../infrastructure/di/container', () => ({
  container: { serviceCatalog: { create: { execute: persistence.create }, update: { execute: persistence.update } } },
}))

function setup<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  let result: T
  function Harness() { result = hook(); return null }
  renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Harness)))
  return { client, mutation: result! }
}

afterEach(() => vi.restoreAllMocks())

describe('mutations reais do catálogo', () => {
  it('persiste criação e invalida a lista, sem aguardar refetch', async () => {
    persistence.create.mockResolvedValueOnce({ id: 'new-service' })
    const { client, mutation } = setup(useCreateServiceCatalog)
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockReturnValueOnce(new Promise(() => {}))
    const dto = { category_id: 'fdb84a10-61f9-4eb2-b176-25421f31eabb', name: 'Vistoria' }
    await expect(mutation.mutateAsync(dto)).resolves.toEqual({ id: 'new-service' })
    expect(persistence.create).toHaveBeenCalledWith(dto)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['service-catalog'] })
    client.clear()
  })

  it('não transforma falha de refetch em falha de persistência na edição', async () => {
    persistence.update.mockResolvedValueOnce({ id: 'existing-service' })
    const { client, mutation } = setup(useUpdateServiceCatalog)
    vi.spyOn(client, 'invalidateQueries').mockRejectedValueOnce(new Error('refetch failed'))
    const dto = { name: 'Novo nome', unit_type: 'hora' }
    await expect(mutation.mutateAsync({ id: 'existing-service', dto })).resolves.toEqual({ id: 'existing-service' })
    expect(persistence.update).toHaveBeenCalledWith('existing-service', dto)
    client.clear()
  })

  it('propaga falha de persistência para tratamento no modal e não invalida', async () => {
    persistence.create.mockRejectedValueOnce(new Error('private database details'))
    const { client, mutation } = setup(useCreateServiceCatalog)
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await expect(mutation.mutateAsync({ category_id: 'category', name: 'Vistoria' })).rejects.toThrow('private database details')
    expect(invalidate).not.toHaveBeenCalled()
    client.clear()
  })
})
