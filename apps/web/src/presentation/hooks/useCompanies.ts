'use client'

import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Company, CompanyType } from '@manager/domain'
import { container } from '../../infrastructure/di/container'
import type { CreateCompanyDto, UpdateCompanyDto } from '../../domain/repositories/company.repository'

type CompaniesListResult = {
  companies: Company[]
  total: number
}

export function useCompanies(params?: { type?: CompanyType; limit?: number; offset?: number }) {
  return useQuery<CompaniesListResult, Error>({
    queryKey: ['companies', params],
    queryFn: () =>
      container.companies.list.execute({
        type: params?.type,
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
      }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  }) as UseQueryResult<CompaniesListResult, Error>
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => container.companies.get.execute(id),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCompanyDto) => container.companies.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCompanyDto }) =>
      container.companies.update.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.companies.delete.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useInternalCompanies() {
  return useQuery<CompaniesListResult, Error>({
    queryKey: ['companies', 'internal'],
    queryFn: () =>
      container.companies.list.execute({
        type: 'internal',
        limit: 200,
        offset: 0,
      }),
    staleTime: 30_000,
  }) as UseQueryResult<CompaniesListResult, Error>
}

export function useCreateInternalCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: Omit<CreateCompanyDto, 'type'>) =>
      container.companies.create.execute({ ...dto, type: 'internal' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}
