import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ServiceCatalogPage from './page'

const query = vi.hoisted(() => ({ isLoading: false, isError: false, isFetching: false, data: [] }))
vi.mock('../../../presentation/hooks/useServiceCatalog', () => ({
  useServiceCatalog: () => ({ ...query, refetch: vi.fn() }),
  useServiceCategories: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
  useCreateServiceCatalog: () => ({ isPending: false }),
  useUpdateServiceCatalog: () => ({ isPending: false }),
  useDeactivateService: () => ({}),
  useAddServicePrice: () => ({ isPending: false }),
}))

beforeEach(() => { query.isLoading = false; query.isError = false })

describe('estados da listagem do catálogo', () => {
  it('não apresenta erro de listagem ou refetch como catálogo vazio', () => {
    query.isError = true
    const html = renderToStaticMarkup(createElement(ServiceCatalogPage))
    expect(html).toContain('role="alert"')
    expect(html).toContain('Não foi possível carregar o catálogo de serviços.')
    expect(html).toContain('Tentar novamente')
    expect(html).not.toContain('Nenhum serviço no catálogo')
  })

  it('apresenta vazio somente quando a consulta não falhou', () => {
    const html = renderToStaticMarkup(createElement(ServiceCatalogPage))
    expect(html).toContain('Nenhum serviço no catálogo')
    expect(html).not.toContain('role="alert"')
  })

  it('anuncia carregamento sem mostrar vazio', () => {
    query.isLoading = true
    const html = renderToStaticMarkup(createElement(ServiceCatalogPage))
    expect(html).toContain('role="status"')
    expect(html).not.toContain('Nenhum serviço no catálogo')
  })
})
