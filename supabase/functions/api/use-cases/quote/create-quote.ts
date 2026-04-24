import { Quote } from '../../../_shared/domain/entities/quote.entity.ts'
import { QuoteRepository } from '../../repositories/quote.repository.ts'
import { badRequest } from '../../errors.ts'
import sql from '../../db.ts'
import { CreateQuoteDto } from '../../validation/schemas.ts'

export async function createQuote(dto: CreateQuoteDto): Promise<Quote> {
  if (dto.company_id) {
    const rows = await sql`SELECT type FROM companies WHERE id = ${dto.company_id}`
    if (rows.length === 0 || rows[0].type !== 'internal') {
      throw badRequest('company_id must reference a company of type internal')
    }
  }

  return QuoteRepository.save({
    customer_id: dto.customer_id,
    company_id: dto.company_id,
    valid_until: dto.valid_until,
    discount: dto.discount,
    notes: dto.notes,
    items: dto.items,
  })
}
