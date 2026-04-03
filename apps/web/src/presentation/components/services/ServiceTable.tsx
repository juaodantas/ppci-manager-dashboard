'use client'

import type { Service } from '@manager/domain'
import { Button } from '../ui/Button'

interface ServiceTableProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDelete: (id: string) => void
}

const statusLabels: Record<string, string> = {
  orcamento: 'Orçamento',
  aprovado: 'Aprovado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const statusColors: Record<string, string> = {
  orcamento: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-purple-100 text-purple-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

export function ServiceTable({ services, onEdit, onDelete }: ServiceTableProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
        <p className="text-gray-500">Nenhum serviço encontrado.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">Valor Total</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {services.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{service.cliente.nome}</div>
                <div className="text-xs text-gray-500">{service.cliente.email}</div>
              </td>
              <td className="px-4 py-3 capitalize text-gray-700">{service.tipo.replace('_', ' ')}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[service.status] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {statusLabels[service.status] ?? service.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {service.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(service)}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(service.id)}>
                    Excluir
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
