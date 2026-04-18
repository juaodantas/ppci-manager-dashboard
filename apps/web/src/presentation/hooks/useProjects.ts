'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'
import type {
  CreateProjectDto,
  UpdateProjectDto,
  AddProjectServiceDto,
  UpdateProjectServiceDto,
  AddProjectTaxDto,
  IssueProjectTaxDto,
} from '../../domain/repositories/project.repository'

export function useProjects(params?: {
  limit?: number
  offset?: number
  status?: string
  customer_id?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () =>
      container.projects.list.execute({
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        status: params?.status,
        customer_id: params?.customer_id,
        search: params?.search,
      }),
    keepPreviousData: true,
    staleTime: 10_000,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => container.projects.get.execute(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProjectDto) => container.projects.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProjectDto }) =>
      container.projects.update.execute(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['projects', id] })
    },
  })
}

export function useAddProjectService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, dto }: { projectId: string; dto: AddProjectServiceDto }) =>
      container.projects.addService.execute(projectId, dto),
    onSuccess: (_data, { projectId }) => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  })
}

export function useUpdateProjectService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, projectId: _pid, dto }: { id: string; projectId: string; dto: UpdateProjectServiceDto }) =>
      container.projects.updateService.execute(id, dto),
    onSuccess: (_data, { projectId }) => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  })
}

export function useRemoveProjectService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, projectId: _pid }: { id: string; projectId: string }) =>
      container.projects.removeService.execute(id),
    onSuccess: (_data, { projectId }) => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  })
}

export function useAddProjectTax() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, dto }: { projectId: string; dto: AddProjectTaxDto }) =>
      container.projects.addTax.execute(projectId, dto),
    onSuccess: (_data, { projectId }) => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  })
}

export function useIssueProjectTax() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, projectId, dto }: { serviceId: string; projectId: string; dto: IssueProjectTaxDto }) =>
      container.projects.issueTax.execute(serviceId, projectId, dto),
    onSuccess: (_data, { projectId }) => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.projects.delete.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
