import { Quote } from '../../../_shared/domain/entities/quote.entity.ts'
import { QuoteRepository } from '../../repositories/quote.repository.ts'
import { CreateQuoteDto } from '../../validation/schemas.ts'

export async function createQuote(dto: CreateQuoteDto): Promise<Quote> {
  return QuoteRepository.save({
    customer_id: dto.customer_id,
    valid_until: dto.valid_until,
    discount: dto.discount,
    notes: dto.notes,
    items: dto.items,
  })
}
