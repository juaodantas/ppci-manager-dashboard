'use client'

import { useState } from 'react'
import type { Service } from '@manager/domain'
import { StatusServico, TipoServico, FormaPagamento } from '@manager/domain'
import type { CreateServiceDto, UpdateServiceDto } from '../../../application/use-cases/service/service.types'
import { createServiceSchema } from '../../../application/validation/service.schemas'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

interface ServiceFormProps {
  initial?: Service
  onSubmit: (data: CreateServiceDto | UpdateServiceDto) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const tipoOptions = [
  { value: TipoServico.OBRA_INCENDIO, label: 'Obra Incêndio' },
  { value: TipoServico.MANUTENCAO, label: 'Manutenção' },
  { value: TipoServico.CONSULTORIA, label: 'Consultoria' },
  { value: TipoServico.PROJETO, label: 'Projeto' },
]

const statusOptions = [
  { value: StatusServico.EM_ANDAMENTO, label: 'Em Andamento' },
  { value: StatusServico.CONCLUIDO, label: 'Concluído' },
  { value: StatusServico.PAUSADO, label: 'Pausado' },
  { value: StatusServico.CANCELADO, label: 'Cancelado' },
]

const formaPagamentoOptions = [
  { value: FormaPagamento.A_VISTA, label: 'À Vista' },
  { value: FormaPagamento.PARCELADO, label: 'Parcelado' },
  { value: FormaPagamento.MENSAL, label: 'Mensal' },
]

export function ServiceForm({ initial, onSubmit, onCancel, loading }: ServiceFormProps) {
  const [form, setForm] = useState({
    clienteNome: initial?.cliente.nome ?? '',
    clienteEmail: initial?.cliente.email ?? '',
    tipo: initial?.tipo ?? TipoServico.OBRA_INCENDIO,
    status: initial?.status ?? StatusServico.EM_ANDAMENTO,
    data_inicio: initial?.data_inicio ?? new Date().toISOString().split('T')[0],
    valor_total: initial?.valor_total ?? 0,
    forma_pagamento: initial?.forma_pagamento ?? FormaPagamento.A_VISTA,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const payload = {
      cliente: {
        id: initial?.cliente.id ?? '',
        nome: form.clienteNome,
        email: form.clienteEmail,
      },
      tipo: form.tipo as TipoServico,
      status: form.status as StatusServico,
      data_inicio: form.data_inicio,
      valor_total: Number(form.valor_total),
      forma_pagamento: form.forma_pagamento as FormaPagamento,
    }

    const result = createServiceSchema.safeParse(payload)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    await onSubmit(result.data as CreateServiceDto | UpdateServiceDto)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input label="Nome do Cliente" value={form.clienteNome} onChange={set('clienteNome')} />
          {errors['cliente.nome'] && <p className="mt-1 text-xs text-red-600">{errors['cliente.nome']}</p>}
        </div>
        <div>
          <Input label="Email do Cliente" type="email" value={form.clienteEmail} onChange={set('clienteEmail')} />
          {errors['cliente.email'] && <p className="mt-1 text-xs text-red-600">{errors['cliente.email']}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Tipo" value={form.tipo} onChange={set('tipo')} options={tipoOptions} />
        <Select label="Status" value={form.status} onChange={set('status')} options={statusOptions} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input label="Data de Início" type="date" value={form.data_inicio} onChange={set('data_inicio')} />
          {errors['data_inicio'] && <p className="mt-1 text-xs text-red-600">{errors['data_inicio']}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Valor Total (R$)"
            type="number"
            min="0"
            step="0.01"
            value={form.valor_total}
            onChange={set('valor_total')}
          />
          {errors['valor_total'] && <p className="mt-1 text-xs text-red-600">{errors['valor_total']}</p>}
        </div>
        <Select
          label="Forma de Pagamento"
          value={form.forma_pagamento}
          onChange={set('forma_pagamento')}
          options={formaPagamentoOptions}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Salvar' : 'Criar Serviço'}
        </Button>
      </div>
    </form>
  )
}
