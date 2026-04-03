'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type { CreateServiceDto, UpdateServiceDto } from '../../application/use-cases/service/service.types'

export function useServices(params?: {
  status?: string
  clienteId?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => container.service.getAll(params),
  })
}

export function useServiceStats() {
  return useQuery({
    queryKey: ['services', 'stats'],
    queryFn: () => container.service.getStats(),
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateServiceDto) => container.createService.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateServiceDto }) => container.updateService.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.deleteService.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}
