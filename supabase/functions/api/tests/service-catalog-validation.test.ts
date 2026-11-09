import { deepStrictEqual, throws } from 'node:assert/strict'
import { HttpError } from '../errors.ts'
import {
  createServiceCatalogSchema,
  updateServiceCatalogSchema,
} from '../validation/schemas.ts'
import { validateBody } from '../validation/validate.ts'

const categoryId = '123e4567-e89b-42d3-a456-426614174000'

for (const [operation, schema, base] of [
  ['create', createServiceCatalogSchema, { category_id: categoryId, name: 'Serviço' }],
  ['update', updateServiceCatalogSchema, { name: 'Serviço' }],
] as const) {
  for (const [label, fields] of [
    ['whitespace-only name', { name: ' \t\n ' }],
    ['empty name', { name: '' }],
    ['name over 255 characters', { name: 'a'.repeat(256) }],
    ['unit over 50 characters', { unit_type: 'u'.repeat(51) }],
    ['null description', { description: null }],
    ['null unit', { unit_type: null }],
  ] as const) {
    Deno.test(`${operation}: ${label} throws HttpError 400`, () => {
      throws(
        () => validateBody(schema, { ...base, ...fields }),
        (error: unknown) => error instanceof HttpError && error.status === 400 && error.message.length > 0,
      )
    })
  }

  Deno.test(`${operation}: accepts and trims maximum-length name and unit`, () => {
    deepStrictEqual(validateBody(schema, {
      ...base,
      name: `  ${'a'.repeat(255)}  `,
      unit_type: `  ${'u'.repeat(50)}  `,
      description: '  Descrição preservada  ',
    }), {
      ...base,
      name: 'a'.repeat(255),
      unit_type: 'u'.repeat(50),
      description: '  Descrição preservada  ',
    })
  })

  Deno.test(`${operation}: accepts a single-character name and omitted optionals`, () => {
    deepStrictEqual(validateBody(schema, { ...base, name: ' a ' }), { ...base, name: 'a' })
  })

  Deno.test(`${operation}: preserves empty optional strings and trims whitespace unit`, () => {
    deepStrictEqual(validateBody(schema, { ...base, description: '', unit_type: ' \t ' }), {
      ...base, description: '', unit_type: '',
    })
  })
}

Deno.test('create: invalid or missing category UUID throws HttpError 400', () => {
  for (const category_id of ['not-a-uuid', '', undefined]) {
    throws(
      () => validateBody(createServiceCatalogSchema, { name: 'Serviço', category_id }),
      (error: unknown) => error instanceof HttpError && error.status === 400 && error.message.length > 0,
    )
  }
})

Deno.test('create: name remains required', () => {
  throws(
    () => validateBody(createServiceCatalogSchema, { category_id: categoryId }),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  )
})

Deno.test('update: fields remain optional and category changes remain excluded', () => {
  deepStrictEqual(validateBody(updateServiceCatalogSchema, {}), {})
  deepStrictEqual(validateBody(updateServiceCatalogSchema, { description: 'Descrição' }), {
    description: 'Descrição',
  })
  deepStrictEqual(validateBody(updateServiceCatalogSchema, { category_id: 'not-a-uuid' }), {})
})
