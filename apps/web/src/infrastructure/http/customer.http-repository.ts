import type { AxiosInstance } from 'axios'
import type { Customer } from '@manager/domain'
import type {
  ICustomerRepository,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerWithCounts,
} from '../../domain/repositories/customer.repository'

export class CustomerHttpRepository implements ICustomerRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(params: { limit: number; offset: number; search?: string }): Promise<{ customers: Customer[]; total: number }> {
    const { data } = await this.http.get<{
      data: Customer[]
      total: number
      limit: number
      offset: number
    }>('/customers', { params })
    return { customers: data.data, total: data.total }
  }

  async findById(id: string): Promise<CustomerWithCounts> {
    const { data } = await this.http.get<CustomerWithCounts>(`/customers/${id}`)
    return data
  }

  async create(body: CreateCustomerDto): Promise<Customer> {
    const { data } = await this.http.post<Customer>('/customers', body)
    return data
  }

  async update(id: string, body: UpdateCustomerDto): Promise<Customer> {
    const { data } = await this.http.put<Customer>(`/customers/${id}`, body)
    return data
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/customers/${id}`)
  }
}
