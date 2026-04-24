'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../../presentation/components/ui/Button'
import { Input } from '../../../../presentation/components/ui/Input'
import { Select } from '../../../../presentation/components/ui/Select'
import { Modal } from '../../../../presentation/components/ui/Modal'
import { useCreateProject } from '../../../../presentation/hooks/useProjects'
import { useCustomers } from '../../../../presentation/hooks/useCustomers'
import { useInternalCompanies, useCreateInternalCompany } from '../../../../presentation/hooks/useCompanies'
import { getApiErrorMessage } from '../../../../presentation/utils/api-error'

export default function NewProjectPage() {
  const router = useRouter()
  const create = useCreateProject()
  const { data: customersData } = useCustomers({ limit: 200 })
  const { data: companiesData } = useInternalCompanies()
  const createInternalCompany = useCreateInternalCompany()

  const [customerId, setCustomerId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [inlineCompanyModalOpen, setInlineCompanyModalOpen] = useState(false)
  const [inlineCompanyName, setInlineCompanyName] = useState('')
  const [inlineCompanyCnpj, setInlineCompanyCnpj] = useState('')
  const [inlineCompanyResponsible, setInlineCompanyResponsible] = useState('')
  const [inlineCompanyError, setInlineCompanyError] = useState('')

  const customers = customersData?.customers ?? []
  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }))
  const companyOptions = (companiesData?.companies ?? []).map((c) => ({ value: c.id, label: c.name }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const project = await create.mutateAsync({
      customer_id: customerId,
      company_id: companyId,
      name,
      description: description || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      total_value: undefined,
    })
    router.push(`/projects/${project.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="sm">← Voltar</Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Projeto</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
        <Select
          label="Cliente *"
          options={customerOptions}
          placeholder="Selecione um cliente"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          required
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
              <Select
                label="Empresa executora *"
                options={companyOptions}
                placeholder="Selecione uma empresa executora"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setInlineCompanyModalOpen(true)} style={{ marginBottom: '1px' }}>+ Criar</Button>
        </div>
          <Input label="Nome do Projeto *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Data de Início" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Previsão de Conclusão" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3">
          <Link href="/projects"><Button type="button" variant="secondary">Cancelar</Button></Link>
          <Button type="submit" loading={create.isPending} disabled={!customerId || !name || !companyId}>Criar Projeto</Button>
        </div>
      </form>

      <Modal
        open={inlineCompanyModalOpen}
        title="Nova Empresa Interna"
        onClose={() => {
          setInlineCompanyModalOpen(false)
          setInlineCompanyError('')
        }}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setInlineCompanyError('')
            try {
              const result = await createInternalCompany.mutateAsync({
                name: inlineCompanyName,
                cnpj: inlineCompanyCnpj,
                responsible: inlineCompanyResponsible,
              })
              setCompanyId(result.id)
              setInlineCompanyModalOpen(false)
              setInlineCompanyName('')
              setInlineCompanyCnpj('')
              setInlineCompanyResponsible('')
              setInlineCompanyError('')
            } catch (err: unknown) {
              setInlineCompanyError(getApiErrorMessage(err, 'Não foi possível criar a empresa.'))
            }
          }}
          className="flex flex-col gap-4"
        >
          {inlineCompanyError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {inlineCompanyError}
            </div>
          )}
          <Input label="Nome *" value={inlineCompanyName} onChange={(e) => setInlineCompanyName(e.target.value)} required />
          <Input label="CNPJ *" value={inlineCompanyCnpj} onChange={(e) => setInlineCompanyCnpj(e.target.value)} placeholder="00.000.000/0000-00" required />
          <Input label="Responsável *" value={inlineCompanyResponsible} onChange={(e) => setInlineCompanyResponsible(e.target.value)} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setInlineCompanyModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createInternalCompany.isPending}>Criar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
