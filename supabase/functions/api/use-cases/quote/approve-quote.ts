import { QuoteRepository } from '../../repositories/quote.repository.ts'
import { notFound, badRequest } from '../../errors.ts'
import { ApproveQuoteDto } from '../../validation/schemas.ts'

export async function approveQuote(
  id: string,
  dto: ApproveQuoteDto,
): Promise<{ project_id: string }> {
  const existing = await QuoteRepository.findById(id)
  if (!existing) throw notFound('Quote', id)

  if (existing.status !== 'draft' && existing.status !== 'sent') {
    throw badRequest(`Cannot approve a quote with status "${existing.status}"`)
  }

  return QuoteRepository.approve(id, {
    name: dto.name,
    start_date: dto.start_date,
  })
}
