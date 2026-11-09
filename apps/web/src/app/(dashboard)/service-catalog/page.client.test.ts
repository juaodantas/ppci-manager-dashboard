// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServiceCatalogWithCategory, ServiceCategory } from '@manager/domain'
import ServiceCatalogPage from './page'

const api = vi.hoisted(() => ({ list: vi.fn(), categories: vi.fn(), create: vi.fn(), update: vi.fn() }))
vi.mock('../../../infrastructure/di/container', () => ({
  container: {
    serviceCatalog: {
      list: { execute: api.list, categories: api.categories },
      create: { execute: api.create },
      update: { execute: api.update },
    },
  },
}))

const category: ServiceCategory = { id: 'fdb84a10-61f9-4eb2-b176-25421f31eabb', name: 'Projetos' }
const service: ServiceCatalogWithCategory = {
  id: 'existing-service', category_id: category.id, category,
  name: 'Vistoria', description: 'Descrição anterior', unit_type: 'hora', is_active: true,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

let host: HTMLDivElement
let root: Root
let client: QueryClient

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.resetAllMocks()
  api.list.mockResolvedValue([])
  api.categories.mockResolvedValue([category])
  api.create.mockResolvedValue(service)
  api.update.mockResolvedValue(service)
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
})

afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  host.remove()
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
})

async function mount() {
  await act(async () => {
    root.render(createElement(QueryClientProvider, { client }, createElement(ServiceCatalogPage)))
  })
}

async function eventually(assertion: () => void) {
  await vi.waitFor(async () => {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
    assertion()
  })
}

function button(text: string, scope: ParentNode = host) {
  const element = Array.from(scope.querySelectorAll('button')).find((item) =>
    item.textContent?.trim() === text || item.lastElementChild?.textContent?.trim() === text)
  if (!element) throw new Error(`Botão não encontrado: ${text}`)
  return element
}

async function click(element: HTMLElement) {
  await act(async () => element.click())
}

function dialog() { return host.querySelector<HTMLElement>('[role="dialog"]') }

function field(label: string) {
  const element = Array.from(host.querySelectorAll('label')).find((item) => item.textContent === label)
  if (!element?.htmlFor) throw new Error(`Campo não encontrado: ${label}`)
  return document.getElementById(element.htmlFor) as HTMLInputElement | HTMLSelectElement
}

async function change(label: string, value: string) {
  const element = field(label)
  await act(async () => {
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
  })
}

async function submit(count = 1) {
  const form = dialog()!.querySelector('form')!
  await act(async () => {
    for (let index = 0; index < count; index++) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    }
  })
}

async function openCreate() {
  await mount()
  await eventually(() => expect(api.categories).toHaveBeenCalledOnce())
  await click(button('+ Novo Serviço'))
}

async function fillCreate() {
  await eventually(() => expect(field('Categoria *').querySelectorAll('option')).toHaveLength(2))
  await change('Categoria *', category.id)
  await change('Nome *', '  Novo serviço  ')
  await change('Descrição', 'Descrição preenchida')
  await change('Unidade (ex: m², horas, unidade)', '  m²  ')
}

describe('catálogo no cliente com hooks e React Query reais', () => {
  it('trata rejeição sem vazar detalhes, preserva modal/valores e permite novo envio', async () => {
    api.create.mockRejectedValueOnce(new Error('SQL private database details'))
    await openCreate()
    await fillCreate()
    await submit()
    await eventually(() => expect(dialog()?.textContent).toContain('Não foi possível salvar o serviço.'))
    expect(dialog()?.textContent).not.toContain('SQL private')
    expect(field('Nome *').value).toBe('  Novo serviço  ')
    expect(field('Descrição').value).toBe('Descrição preenchida')
    expect(field('Unidade (ex: m², horas, unidade)').value).toBe('  m²  ')
    expect(field('Categoria *').value).toBe(category.id)
    expect(button('Salvar').disabled).toBe(false)
    await submit()
    await eventually(() => expect(dialog()).toBeNull())
    expect(api.create).toHaveBeenCalledTimes(2)
    expect(api.create).toHaveBeenLastCalledWith({
      category_id: category.id, name: 'Novo serviço', description: 'Descrição preenchida', unit_type: 'm²',
    })
  })

  it('deduplica submits síncronos e bloqueia Escape, backdrop, cancelar e fechar durante pending', async () => {
    const pending = deferred<ServiceCatalogWithCategory>()
    api.create.mockReturnValueOnce(pending.promise)
    await openCreate()
    await fillCreate()
    await submit(2)
    await eventually(() => expect(button('Salvar').disabled).toBe(true))
    expect(api.create).toHaveBeenCalledOnce()
    expect(field('Nome *').disabled).toBe(true)
    expect(button('Cancelar').disabled).toBe(true)
    const close = dialog()!.querySelector<HTMLButtonElement>('[aria-label="Fechar modal"]')!
    expect(close.disabled).toBe(true)
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    expect(dialog()).not.toBeNull()
    await click(dialog()!.previousElementSibling as HTMLElement)
    expect(dialog()).not.toBeNull()
    await click(button('Cancelar'))
    await click(close)
    expect(dialog()).not.toBeNull()
    await submit()
    expect(api.create).toHaveBeenCalledOnce()
    await act(async () => pending.resolve(service))
    await eventually(() => expect(dialog()).toBeNull())
  })

  it('fecha após persistir mesmo com refetch rejeitado; retry recupera a listagem', async () => {
    await openCreate()
    await fillCreate()
    api.list.mockRejectedValueOnce(new Error('refetch failed'))
    await submit()
    await eventually(() => {
      expect(dialog()).toBeNull()
      expect(host.textContent).toContain('Não foi possível carregar o catálogo de serviços.')
    })
    expect(api.create).toHaveBeenCalledOnce()
    expect(api.list).toHaveBeenCalledTimes(2)
    expect(host.textContent).not.toContain('Não foi possível salvar')
    expect(host.textContent).not.toContain('Nenhum serviço no catálogo')
    api.list.mockResolvedValueOnce([service])
    await click(button('Tentar novamente'))
    await eventually(() => expect(host.textContent).toContain('Vistoria'))
    expect(host.textContent).not.toContain('Não foi possível carregar o catálogo')
    expect(api.list).toHaveBeenCalledTimes(3)
  })

  it('permite fechar por Escape, backdrop e cancelar quando não há envio', async () => {
    await openCreate()
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    expect(dialog()).toBeNull()
    await click(button('+ Novo Serviço'))
    await click(dialog()!.previousElementSibling as HTMLElement)
    expect(dialog()).toBeNull()
    await click(button('+ Novo Serviço'))
    await click(button('Cancelar'))
    expect(dialog()).toBeNull()
    expect(api.create).not.toHaveBeenCalled()
  })

  it('retry de categorias recupera a criação sem perder o nome já preenchido', async () => {
    api.categories.mockRejectedValueOnce(new Error('categories failed'))
    await openCreate()
    await change('Nome *', 'Nome preservado')
    await eventually(() => expect(dialog()?.textContent).toContain('Não foi possível carregar as categorias.'))
    expect(button('Salvar').disabled).toBe(true)
    expect(dialog()?.textContent).not.toContain('Nenhuma categoria disponível')
    await submit()
    expect(api.create).not.toHaveBeenCalled()
    await click(button('Tentar novamente', dialog()!))
    await eventually(() => expect(button('Salvar').disabled).toBe(false))
    expect(field('Nome *').value).toBe('Nome preservado')
    expect(dialog()?.textContent).not.toContain('Não foi possível carregar as categorias.')
    await change('Categoria *', category.id)
    await submit()
    await eventually(() => expect(dialog()).toBeNull())
    expect(api.create).toHaveBeenCalledOnce()
    expect(api.categories).toHaveBeenCalledTimes(3) // initial, retry, invalidation after save
  })

  it('bloqueia criação enquanto categorias carregam e quando retornam vazias', async () => {
    const pending = deferred<ServiceCategory[]>()
    api.categories.mockReturnValueOnce(pending.promise)
    await openCreate()
    expect(dialog()?.textContent).toContain('Carregando categorias...')
    expect(button('Salvar').disabled).toBe(true)
    await submit()
    expect(api.create).not.toHaveBeenCalled()
    await act(async () => pending.resolve([]))
    await eventually(() => expect(dialog()?.textContent).toContain('Nenhuma categoria disponível.'))
    expect(button('Salvar').disabled).toBe(true)
    await submit()
    expect(api.create).not.toHaveBeenCalled()
  })

  it.each(['loading', 'error', 'empty'] as const)('edita com categorias %s e envia strings vazias reais ao apagar campos', async (state) => {
    api.list.mockResolvedValue([service])
    if (state === 'loading') api.categories.mockReturnValue(new Promise(() => {}))
    if (state === 'error') api.categories.mockRejectedValue(new Error('categories failed'))
    if (state === 'empty') api.categories.mockResolvedValue([])
    await mount()
    await eventually(() => expect(host.textContent).toContain('Vistoria'))
    if (state !== 'loading') {
      await eventually(() => expect(client.getQueryState(['service-catalog', 'categories'])?.status).toBe(state === 'error' ? 'error' : 'success'))
    }
    await click(button('Editar'))
    expect(button('Salvar').disabled).toBe(false)
    expect(field('Categoria *').value).toBe(category.id)
    expect(field('Categoria *').disabled).toBe(true)
    expect(dialog()?.textContent).toContain('A categoria não pode ser alterada na edição.')
    expect(dialog()?.querySelector('[role="alert"], [role="status"]')).toBeNull()
    expect(dialog()?.textContent).not.toContain('Carregando categorias')
    expect(dialog()?.textContent).not.toContain('Nenhuma categoria disponível')
    await change('Descrição', '')
    await change('Unidade (ex: m², horas, unidade)', '')
    await submit()
    await eventually(() => expect(dialog()).toBeNull())
    expect(api.update).toHaveBeenCalledOnce()
    expect(api.update).toHaveBeenCalledWith(service.id, {
      name: 'Vistoria', description: '', unit_type: '',
    })
    expect(api.create).not.toHaveBeenCalled()
  })
})
