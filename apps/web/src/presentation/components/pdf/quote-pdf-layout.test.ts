import { Image, renderToBuffer } from '@react-pdf/renderer'
import { Children, cloneElement, isValidElement, type ReactElement } from 'react'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Quote, QuoteItem } from '@manager/domain'
import { QuotePDF } from './quote-pdf'

type LayoutNode = {
  type: string
  value?: string
  box: { top: number; left: number; width: number; height: number }
  children?: LayoutNode[]
}

// Exercise the production document, including a real logo, without HTTP or a
// browser. Only the browser-relative image source is resolved for Node.
function withLocalLogo<P>(element: ReactElement<P>): ReactElement<P> {
  const props = element.props as { children?: ReactElement[] }
  if (element.type === Image) {
    return cloneElement(element, { src: readFileSync(new URL('../../../../public/logo.png', import.meta.url)) } as never)
  }
  return cloneElement(element, {}, ...Children.toArray(props.children).map((child) =>
    isValidElement(child) ? withLocalLogo(child) : child,
  ))
}

function text(node: LayoutNode): string {
  return node.value ?? (node.children ?? []).map(text).join('')
}

function geometry(node: LayoutNode): LayoutNode {
  return { type: node.type, box: node.box, value: node.value, children: node.children?.map(geometry) }
}

function assertContained(node: LayoutNode) {
  let previousBottom = 0
  for (const child of node.children ?? []) {
    if (child.type === 'TEXT_INSTANCE') continue
    expect(child.box.top, `overlap before ${text(child)}`).toBeGreaterThanOrEqual(previousBottom - 0.1)
    expect(child.box.height, `height of ${text(child)}`).toBeGreaterThan(0)
    expect(child.box.top + child.box.height, `bottom of ${text(child)} exceeds parent height ${node.box.height}`)
      .toBeLessThanOrEqual(node.box.height + 0.1)
    expect(child.box.left + child.box.width).toBeLessThanOrEqual(node.box.width + 0.1)
    previousBottom = child.box.top + child.box.height
    assertContained(child)
  }
}

const baseQuote = {
  id: 'quote-layout', customer_id: 'customer-layout', status: 'draft', discount: 0,
  total_amount: 100, created_at: '2026-01-15T12:00:00Z', updated_at: '2026-01-15T12:00:00Z',
} as Quote

describe('QuotePDF customer visibility geometry', () => {
  it.each([
    ['cpf', 'Cliente Exemplo', '000.000.000-00', 1],
    ['cnpj', 'Empresa Exemplo', '00.000.000/0002-00', 1],
    ['no-document', 'Cliente Sem Documento', undefined, 1],
    ['long-multipage', 'Associacao de Proprietarios e Moradores do Condominio Residencial de Protecao e Prevencao '.repeat(5).trim(), '00.000.000/0002-00', 70],
  ] as const)('%s keeps customer text inside its blocks and above services', async (name, customerName, customerDocument, count) => {
    const items: QuoteItem[] = Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`, quote_id: baseQuote.id, service_id: 'service', description: `Servico ${i + 1}`,
      quantity: 1, unit_price: 100, total_price: 100,
    }))
    let layout: LayoutNode | undefined
    const document = withLocalLogo(QuotePDF({ quote: { ...baseQuote, items }, customerName, customerDocument }))
    const buffer = await renderToBuffer(cloneElement(document, {
      onRender: (data: { _INTERNAL__LAYOUT__DATA_: LayoutNode }) => { layout = data._INTERNAL__LAYOUT__DATA_ },
    } as never))
    expect(layout).toBeDefined()
    if (process.env.QUOTE_PDF_ARTIFACT_DIR) {
      mkdirSync(process.env.QUOTE_PDF_ARTIFACT_DIR, { recursive: true })
      writeFileSync(`${process.env.QUOTE_PDF_ARTIFACT_DIR}/${name}.pdf`, buffer)
      writeFileSync(`${process.env.QUOTE_PDF_ARTIFACT_DIR}/${name}.json`, JSON.stringify(geometry(layout!), null, 2))
    }
    const pages = layout!.children!
    if (count > 1) expect(pages.length).toBeGreaterThan(1)
    const sections = pages[0].children!
    const client = sections.find((node) => node.children?.some((child) => text(child) === 'Cliente'))!
    const services = sections.find((node) => node.children?.some((child) => text(child) === 'Serviços'))!
    expect(client.box.top).toBeGreaterThanOrEqual(0)
    expect(client.box.top + client.box.height).toBeLessThan(pages[0].box.height)
    expect(text(client)).toContain(customerName)
    if (customerDocument) expect(text(client)).toContain(customerDocument)
    else expect(text(client)).not.toContain('CPF/CNPJ')
    assertContained(client)
    if (name === 'long-multipage') {
      const nameBlock = client.children![1]
      // The name wraps to several lines rather than being clipped to one line.
      expect(nameBlock.children![1].box.height).toBeGreaterThan(30)
    }
    expect(client.box.top + client.box.height).toBeLessThanOrEqual(services.box.top)
  })
})
