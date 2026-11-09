import { Quote } from '../../../_shared/domain/entities/quote.entity.ts'
import { QuoteRepository } from '../../repositories/quote.repository.ts'
import { UpdateQuoteDto } from '../../validation/schemas.ts'

export async function updateQuote(id: string, dto: UpdateQuoteDto): Promise<Quote> {
  // Existence and editability must be checked under the same lock as approval.
  return await QuoteRepository.update(id, dto)
}
