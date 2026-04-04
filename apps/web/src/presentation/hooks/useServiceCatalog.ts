'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type {
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
  AddServicePriceDto,
} from '../../domain/repositories/service-catalog.repository'

export function useServiceCatalog(includeInactive = false) {
  return useQuery({
    queryKey: ['service-catalog', { includeInactive }],
    queryFn: () => container.serviceCatalog.list.execute(includeInactive),
  })
}

export function useServiceCategories() {
  return useQuery({
    queryKey: ['service-catalog', 'categories'],
    queryFn: () => container.serviceCatalog.list.categories(),
  })
}

export function useCreateServiceCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateServiceCatalogDto) => container.serviceCatalog.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  })
}

export function useUpdateServiceCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateServiceCatalogDto }) =>
      container.serviceCatalog.update.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  })
}

export function useDeactivateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.serviceCatalog.deactivate.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  })
}

export function useAddServicePrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, dto }: { serviceId: string; dto: AddServicePriceDto }) =>
      container.serviceCatalog.addPrice.execute(serviceId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog'] }),
  })
}
