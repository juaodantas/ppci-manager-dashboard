import type { AxiosInstance } from 'axios'
import { z } from 'zod'
import type {
  FixedCostMonthResolution,
  IFixedCostMonthRepository,
  UpdateFixedCostMonthlyEntryDto,
} from '../../domain/repositories/fixed-cost-month.repository'

const fixedCostMonthResolutionSchema = z.object({
  month: z.object({
    id: z.string().nullable(),
    reference_year: z.number(),
    reference_month: z.number(),
    company_id: z.string().nullable(),
    status: z.enum(['open', 'confirmed', 'closed']).transform((status) => status === 'closed' ? 'closed' : 'confirmed'),
    confirmed_at: z.string().nullable(),
    closed_at: z.string().nullable(),
  }),
  items: z.array(z.object({
    id: z.string(),
    fixed_cost_id: z.string(),
    monthly_entry_id: z.string().nullable(),
    name: z.string(),
    category: z.string().nullable(),
    company_id: z.string().nullable(),
    due_day: z.number(),
    due_date: z.string(),
    base_amount: z.number(),
    recurring_base_amount: z.number(),
    monthly_base_amount: z.number(),
    interest_amount: z.number(),
    monthly_amount: z.number(),
    included: z.boolean(),
    source: z.enum(['dynamic_base', 'monthly_entry']),
    status: z.enum(['open', 'predicted', 'edited', 'confirmed', 'closed']).transform((status) => {
      if (status === 'closed' || status === 'edited') return status
      return 'confirmed'
    }),
    is_editable: z.boolean(),
    edit_block_reason: z.enum(['before_start_date', 'after_end_date', 'inactive', 'month_closed']).optional(),
    edit_block_message: z.string().optional(),
    base_relation_status: z.enum(['active_for_month', 'inactive_for_month', 'snapshot_only']),
  })),
  summary: z.object({
    total_base_amount: z.number(),
    total_interest_amount: z.number(),
    total_monthly_amount: z.number(),
    predicted_count: z.number(),
    edited_count: z.number(),
    confirmed_count: z.number(),
    closed_count: z.number(),
  }),
})

function parseResolution(data: unknown): FixedCostMonthResolution {
  return fixedCostMonthResolutionSchema.parse(data)
}

export class FixedCostMonthHttpRepository implements IFixedCostMonthRepository {
  constructor(private readonly http: AxiosInstance) {}

  async get(params: { reference_year: number; reference_month: number; company_id?: string }): Promise<FixedCostMonthResolution> {
    const { data } = await this.http.get<unknown>('/fixed-costs/monthly', { params })
    return parseResolution(data)
  }

  async close(params: { referenceYear: number; referenceMonth: number; companyId?: string }): Promise<FixedCostMonthResolution> {
    const { data } = await this.http.post<unknown>(
      `/fixed-costs/monthly/${params.referenceYear}/${params.referenceMonth}/close`,
      null,
      { params: { company_id: params.companyId } },
    )
    return parseResolution(data)
  }

  async updateEntry(params: {
    fixedCostId: string
    referenceYear: number
    referenceMonth: number
    data: UpdateFixedCostMonthlyEntryDto
  }): Promise<FixedCostMonthResolution> {
    const { data } = await this.http.put<unknown>(
      `/fixed-costs/${params.fixedCostId}/monthly/${params.referenceYear}/${params.referenceMonth}`,
      params.data,
    )
    return parseResolution(data)
  }
}
