'use client'

import { useState } from 'react'
import type { User } from '@manager/domain'
import { Button } from '../../../presentation/components/ui/Button'
import { Modal } from '../../../presentation/components/ui/Modal'
import { Input } from '../../../presentation/components/ui/Input'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../../presentation/hooks/useUsers'

interface UserFormState {
  name: string
  email: string
  password: string
}

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | undefined>()
  const [form, setForm] = useState<UserFormState>({ name: '', email: '', password: '' })
  const [formError, setFormError] = useState('')

  const set = (key: keyof UserFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const openCreate = () => {
    setEditing(undefined)
    setForm({ name: '', email: '', password: '' })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setForm({ name: user.name, email: user.email as unknown as string, password: '' })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    try {
      if (editing) {
        const dto: { name?: string; password?: string } = { name: form.name }
        if (form.password) dto.password = form.password
        await updateUser.mutateAsync({ id: editing.id, dto })
      } else {
        await createUser.mutateAsync({ name: form.name, email: form.email, password: form.password })
      }
      setModalOpen(false)
    } catch {
      setFormError('Ocorreu um erro. Verifique os dados.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma a exclusão do usuário?')) return
    await deleteUser.mutateAsync(id)
  }

  const isPending = createUser.isPending || updateUser.isPending

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <Button onClick={openCreate}>Novo Usuário</Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-700">{user.email as unknown as string}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Editar Usuário' : 'Novo Usuário'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nome" value={form.name} onChange={set('name')} required />
          {!editing && (
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
          )}
          <Input
            label={editing ? 'Nova Senha (opcional)' : 'Senha'}
            type="password"
            value={form.password}
            onChange={set('password')}
            required={!editing}
            minLength={6}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              {editing ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
