import { Quote } from '../../../_shared/domain/entities/quote.entity.ts'
import { QuoteRepository } from '../../repositories/quote.repository.ts'
import { notFound } from '../../errors.ts'

export async function getAllQuotes(params: {
  limit: number
  offset: number
  status?: string
  customer_id?: string
}): Promise<{ quotes: Quote[]; total: number }> {
  return QuoteRepository.findAll(params)
}

export async function getQuoteById(id: string): Promise<Quote> {
  const quote = await QuoteRepository.findById(id)
  if (!quote) throw notFound('Quote', id)
  return quote
}
