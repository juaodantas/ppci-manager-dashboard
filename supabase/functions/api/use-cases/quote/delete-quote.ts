import { QuoteRepository } from '../../repositories/quote.repository.ts'
import { notFound, badRequest } from '../../errors.ts'

export async function deleteQuote(id: string): Promise<void> {
  const existing = await QuoteRepository.findById(id)
  if (!existing) throw notFound('Quote', id)

  if (existing.status !== 'draft') {
    throw badRequest('Only draft quotes can be deleted')
  }

  await QuoteRepository.delete(id)
}
