import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ServiceCatalogForm } from './ServiceCatalogForm'
import { Modal } from './ui/Modal'

const defaults: ComponentProps<typeof ServiceCatalogForm> = {
  categories: [{ value: 'fdb84a10-61f9-4eb2-b176-25421f31eabb', label: 'Projetos' }],
  loading: false,
  categoriesLoading: false,
  categoriesError: false,
  submitError: null,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  retryCategories: vi.fn(),
}
const render = (props: Partial<typeof defaults> = {}) => renderToStaticMarkup(createElement(ServiceCatalogForm, { ...defaults, ...props }))

describe('estados renderizados do formulário do catálogo', () => {
  it.each<[Partial<typeof defaults>, string, string]>([
    [{ categoriesLoading: true }, 'Carregando categorias...', 'status'],
    [{ categoriesError: true }, 'Não foi possível carregar as categorias.', 'alert'],
    [{ categories: [] }, 'Nenhuma categoria disponível.', 'status'],
  ])('bloqueia salvar quando categorias estão indisponíveis: %s', (props, message, role) => {
    const html = render(props)
    expect(html).toContain(message)
    expect(html).toContain(`role="${role}"`)
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*type="submit"/)
  })

  it('oferece retry na falha, sem apresentá-la como categoria vazia', () => {
    const html = render({ categoriesError: true, categories: [] })
    expect(html).toContain('Tentar novamente')
    expect(html).not.toContain('Nenhuma categoria disponível.')
  })

  it('bloqueia campos e cancelamento durante o envio', () => {
    const html = render({ loading: true })
    expect(html).toContain('aria-busy="true"')
    expect(html).toMatch(/<input[^>]*disabled=""/)
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*type="button"/)
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*type="submit"/)
  })

  it('permite desabilitar explicitamente o fechamento do modal durante envio', () => {
    const props: ComponentProps<typeof Modal> = {
      open: true, title: 'Novo Serviço', onClose: vi.fn(), closeDisabled: true, children: null,
    }
    const html = renderToStaticMarkup(createElement(Modal, props))
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Fechar modal"/)
  })

  it('exibe a falha acessível e mantém os valores da edição, com categoria bloqueada', () => {
    const initial = {
      id: 'service-id', category_id: defaults.categories[0].value,
      name: 'Vistoria preservada', description: 'Descrição preservada', unit_type: 'hora',
      category: { name: 'Projetos' },
    } as NonNullable<typeof defaults.initial>
    const html = render({ initial, submitError: 'Não foi possível salvar o serviço.' })
    expect(html).toContain('role="alert"')
    expect(html).toContain('value="Vistoria preservada"')
    expect(html).toContain('value="Descrição preservada"')
    expect(html).toContain('value="hora"')
    expect(html).toMatch(/<select[^>]*disabled=""/)
    expect(html).toContain('A categoria não pode ser alterada na edição.')
  })
})
