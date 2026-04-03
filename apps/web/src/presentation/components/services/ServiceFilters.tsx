'use client'

import { StatusServico, TipoServico } from '@manager/domain'
import { Select } from '../ui/Select'

interface ServiceFiltersProps {
  status: string
  tipo: string
  onStatusChange: (value: string) => void
  onTipoChange: (value: string) => void
}

const statusOptions = [
  { value: StatusServico.EM_ANDAMENTO, label: 'Em Andamento' },
  { value: StatusServico.CONCLUIDO, label: 'Concluído' },
  { value: StatusServico.PAUSADO, label: 'Pausado' },
  { value: StatusServico.CANCELADO, label: 'Cancelado' },
]

const tipoOptions = [
  { value: TipoServico.OBRA_INCENDIO, label: 'Obra Incêndio' },
  { value: TipoServico.CONSULTORIA, label: 'Consultoria' },
  { value: TipoServico.PROJETO, label: 'Projeto' },
  { value: TipoServico.MANUTENCAO, label: 'Manutenção' },
]

export function ServiceFilters({ status, tipo, onStatusChange, onTipoChange }: ServiceFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-48">
        <Select
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
          placeholder="Todos os status"
        />
      </div>
      <div className="w-48">
        <Select
          label="Tipo"
          value={tipo}
          onChange={(e) => onTipoChange(e.target.value)}
          options={tipoOptions}
          placeholder="Todos os tipos"
        />
      </div>
    </div>
  )
}
