'use client'

import { useState } from 'react'
import { Button } from '../../../presentation/components/ui/Button'
import { Input } from '../../../presentation/components/ui/Input'
import { Modal } from '../../../presentation/components/ui/Modal'
import { Select } from '../../../presentation/components/ui/Select'
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '../../../presentation/hooks/useCompanies'
import type { Company, CompanyType } from '@manager/domain'
import type { CreateCompanyDto, UpdateCompanyDto } from '../../../domain/repositories/company.repository'

const TABS = [
  { key: 'internal' as const, label: 'Interna' },
  { key: 'supplier' as const, label: 'Fornecedores' },
  { key: 'outsourced' as const, label: 'Terceirizados' },
]

const typeOptions = [
  { value: 'internal', label: 'Interna' },
  { value: 'supplier', label: 'Fornecedor' },
  { value: 'outsourced', label: 'Terceirizada' },
]

function CompanyForm<T extends CreateCompanyDto | UpdateCompanyDto>({
  initial,
  defaultType,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Company
  defaultType: string
  onSubmit: (dto: T) => void
  onCancel: () => void
  loading: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [cnpj, setCnpj] = useState(initial?.cnpj ?? '')
  const [responsible, setResponsible] = useState(initial?.responsible ?? '')
  const [type, setType] = useState(initial?.type ?? defaultType)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ name, cnpj, responsible, type: type as CompanyType } as T)
      }}
      className="flex flex-col gap-4"
    >
      <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="CNPJ *" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" required />
      <Input label="Responsável *" value={responsible} onChange={(e) => setResponsible(e.target.value)} required />
      <Select label="Tipo *" options={typeOptions} value={type} onChange={(e) => setType(e.target.value)} required />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  )
}

export default function CompaniesPage() {
  const [activeTab, setActiveTab] = useState<string>('internal')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | undefined>()

  const { data, isLoading } = useCompanies({ type: activeTab as 'internal' | 'supplier' | 'outsourced', limit: 100 })
  const createMutation = useCreateCompany()
  const updateMutation = useUpdateCompany()
  const deleteMutation = useDeleteCompany()

  const companies = data?.companies ?? []

  const handleCreate = async (dto: CreateCompanyDto) => {
    await createMutation.mutateAsync(dto)
    setCreateModalOpen(false)
  }

  const handleUpdate = async (dto: UpdateCompanyDto) => {
    if (!editingCompany) return
    await updateMutation.mutateAsync({ id: editingCompany.id, dto })
    setEditingCompany(undefined)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta empresa?')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir'
      alert(message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Empresa</h1>
        <Button onClick={() => setCreateModalOpen(true)}>+ Nova Empresa</Button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Carregando...</div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">CNPJ</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Responsável</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400">Nenhuma empresa encontrada</td></tr>
              )}
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{company.cnpj}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{company.responsible}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditingCompany(company)}>Editar</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(company.id)}>Excluir</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createModalOpen} title="Nova Empresa" onClose={() => setCreateModalOpen(false)}>
        <CompanyForm
          defaultType={activeTab}
          onSubmit={handleCreate}
          onCancel={() => setCreateModalOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      <Modal open={!!editingCompany} title="Editar Empresa" onClose={() => setEditingCompany(undefined)}>
        {editingCompany && (
          <CompanyForm
            initial={editingCompany}
            defaultType={activeTab}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCompany(undefined)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  )
}
