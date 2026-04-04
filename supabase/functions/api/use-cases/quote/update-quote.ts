import { Quote } from '../../../_shared/domain/entities/quote.entity.ts'
import { QuoteRepository } from '../../repositories/quote.repository.ts'
import { notFound, badRequest } from '../../errors.ts'
import { UpdateQuoteDto } from '../../validation/schemas.ts'

export async function updateQuote(id: string, dto: UpdateQuoteDto): Promise<Quote> {
  const existing = await QuoteRepository.findById(id)
  if (!existing) throw notFound('Quote', id)

  if (existing.status === 'approved' || existing.status === 'rejected') {
    throw badRequest(`Cannot update a quote with status "${existing.status}"`)
  }

  const updated = await QuoteRepository.update(id, {
    valid_until: dto.valid_until,
    discount: dto.discount,
    notes: dto.notes,
    status: dto.status,
    items: dto.items,
  })

  return updated!
}
