import type { Quote } from '@manager/domain'
import type {
  IQuoteRepository,
  CreateQuoteDto,
  UpdateQuoteDto,
  ApproveQuoteDto,
} from '../../../domain/repositories/quote.repository'

export class GetQuotesUseCase {
  constructor(private readonly repo: IQuoteRepository) {}
  execute(params: {
    limit: number
    offset: number
    status?: string
    customer_id?: string
  }): Promise<{ quotes: Quote[]; total: number }> {
    return this.repo.findAll(params)
  }
}

export class GetQuoteUseCase {
  constructor(private readonly repo: IQuoteRepository) {}
  execute(id: string): Promise<Quote> {
    return this.repo.findById(id)
  }
}

export class CreateQuoteUseCase {
  constructor(private readonly repo: IQuoteRepository) {}
  execute(data: CreateQuoteDto): Promise<Quote> {
    return this.repo.create(data)
  }
}

export class UpdateQuoteUseCase {
  constructor(private readonly repo: IQuoteRepository) {}
  execute(id: string, data: UpdateQuoteDto): Promise<Quote> {
    return this.repo.update(id, data)
  }
}

export class DeleteQuoteUseCase {
  constructor(private readonly repo: IQuoteRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}

export class ApproveQuoteUseCase {
  constructor(private readonly repo: IQuoteRepository) {}
  execute(id: string, data: ApproveQuoteDto): Promise<{ project_id: string }> {
    return this.repo.approve(id, data)
  }
}
