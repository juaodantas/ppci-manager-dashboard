'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { container } from '../../infrastructure/di/container'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => container.user.getAll(),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { name: string; email: string; password: string }) =>
      container.createUser.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; password?: string } }) =>
      container.updateUser.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.deleteUser.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
