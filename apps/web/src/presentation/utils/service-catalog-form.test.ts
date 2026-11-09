import { describe, expect, it } from 'vitest'
import { serviceCatalogFormSchema } from './service-catalog-form'

const valid = { category_id: 'fdb84a10-61f9-4eb2-b176-25421f31eabb', name: 'Vistoria' }

describe('validação do formulário do catálogo', () => {
  it('normaliza nome e unidade sem alterar a descrição', () => {
    expect(serviceCatalogFormSchema.parse({ ...valid, name: '  Vistoria  ', unit_type: '  m²  ', description: ' texto ' }))
      .toEqual({ ...valid, unit_type: 'm²', description: ' texto ' })
  })

  it.each(['', '   ', 'a'.repeat(256)])('rejeita nome inválido: %s', (name) => {
    expect(serviceCatalogFormSchema.safeParse({ ...valid, name }).success).toBe(false)
  })

  it('aceita os limites após trim e unidade opcional', () => {
    expect(serviceCatalogFormSchema.parse({ ...valid, name: ` ${'a'.repeat(255)} `, unit_type: ` ${'m'.repeat(50)} ` }))
      .toMatchObject({ name: 'a'.repeat(255), unit_type: 'm'.repeat(50) })
    expect(serviceCatalogFormSchema.safeParse(valid).success).toBe(true)
    expect(serviceCatalogFormSchema.safeParse({ ...valid, name: 'a', unit_type: '   ' }).success).toBe(true)
    expect(serviceCatalogFormSchema.safeParse({ ...valid, unit_type: 'm'.repeat(51) }).success).toBe(false)
  })

  it.each(['', 'categoria', '123'])('exige UUID para categoria: %s', (category_id) => {
    expect(serviceCatalogFormSchema.safeParse({ ...valid, category_id }).success).toBe(false)
  })
})
