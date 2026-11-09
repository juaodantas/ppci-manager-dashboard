import { QuoteRepository } from '../../repositories/quote.repository.ts'
import { ApproveQuoteDto } from '../../validation/schemas.ts'

export async function approveQuote(
  id: string,
  dto: ApproveQuoteDto,
): Promise<{ project_id: string }> {
  return await QuoteRepository.approve(id, {
    name: dto.name,
    start_date: dto.start_date,
  })
}
