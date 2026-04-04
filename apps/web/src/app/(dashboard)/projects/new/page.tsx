'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../../presentation/components/ui/Button'
import { Input } from '../../../../presentation/components/ui/Input'
import { Select } from '../../../../presentation/components/ui/Select'
import { useCreateProject } from '../../../../presentation/hooks/useProjects'
import { useCustomers } from '../../../../presentation/hooks/useCustomers'

export default function NewProjectPage() {
  const router = useRouter()
  const create = useCreateProject()
  const { data: customersData } = useCustomers({ limit: 200 })

  const [customerId, setCustomerId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const customers = customersData?.customers ?? []
  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const project = await create.mutateAsync({
      customer_id: customerId,
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
          <Input label="Nome do Projeto *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Data de Início" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Previsão de Conclusão" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3">
          <Link href="/projects"><Button type="button" variant="secondary">Cancelar</Button></Link>
          <Button type="submit" loading={create.isPending} disabled={!customerId || !name}>Criar Projeto</Button>
        </div>
      </form>
    </div>
  )
}
