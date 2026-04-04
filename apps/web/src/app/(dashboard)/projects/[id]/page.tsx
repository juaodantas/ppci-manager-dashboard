'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ProjectService } from '@manager/domain'
import { useProject, useUpdateProject, useAddProjectService, useRemoveProjectService, useDeleteProject } from '../../../../presentation/hooks/useProjects'
import { usePayments, useCreatePayment, usePayPayment } from '../../../../presentation/hooks/usePayments'
import { useServiceCatalog } from '../../../../presentation/hooks/useServiceCatalog'
import { useCustomer } from '../../../../presentation/hooks/useCustomers'
import { Button } from '../../../../presentation/components/ui/Button'
import { Modal } from '../../../../presentation/components/ui/Modal'
import { Input } from '../../../../presentation/components/ui/Input'
import { Select } from '../../../../presentation/components/ui/Select'
import type { AddProjectServiceDto } from '../../../../domain/repositories/project.repository'
import type { CreatePaymentDto } from '../../../../domain/repositories/payment.repository'

const ContractDownloadButton = dynamic(
  () => import('../../../../presentation/components/pdf/ContractDownloadButton').then((m) => m.ContractDownloadButton),
  { ssr: false, loading: () => <button className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-500">PDF…</button> },
)

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planejamento', in_progress: 'Em andamento', finished: 'Concluído', canceled: 'Cancelado',
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planejamento' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'finished', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
]

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700',
  finished: 'bg-green-100 text-green-700', canceled: 'bg-gray-100 text-gray-500',
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: project, isLoading } = useProject(id)
  const { data: paymentsData } = usePayments({ project_id: id, limit: 50, offset: 0 })
  const { data: catalog } = useServiceCatalog()
  const { data: customer } = useCustomer(project?.customer_id ?? '')
  const updateProject = useUpdateProject()
  const addService = useAddProjectService()
  const removeService = useRemoveProjectService()
  const deleteProject = useDeleteProject()
  const createPayment = useCreatePayment()
  const payPayment = usePayPayment()

  const [tab, setTab] = useState<'services' | 'payments'>('services')
  const [addServiceOpen, setAddServiceOpen] = useState(false)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  // edit form
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editTotalValue, setEditTotalValue] = useState('')

  // service form
  const [svcServiceId, setSvcServiceId] = useState('')
  const [svcQty, setSvcQty] = useState('1')
  const [svcPrice, setSvcPrice] = useState('')
  const [svcDesc, setSvcDesc] = useState('')

  // payment form
  const [pmtAmount, setPmtAmount] = useState('')
  const [pmtDueDate, setPmtDueDate] = useState('')
  const [pmtMethod, setPmtMethod] = useState('')
  const [pmtNotes, setPmtNotes] = useState('')

  // pay modal
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payingId, setPayingId] = useState('')
  const [paidDate, setPaidDate] = useState('')

  if (isLoading) return <div className="py-12 text-center text-gray-500">Carregando...</div>
  if (!project) return <div className="py-12 text-center text-gray-500">Projeto não encontrado</div>

  const isFinished = project.status === 'finished'
  const services = project.services ?? []
  const payments = paymentsData?.payments ?? []
  const serviceOptions = (catalog ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.category.name})` }))
  const customerName = customer?.name ?? project.customer_id

  const handleOpenEdit = () => {
    setEditName(project.name)
    setEditDesc(project.description ?? '')
    setEditStartDate(project.start_date ?? '')
    setEditEndDate(project.end_date ?? '')
    setEditTotalValue(String(project.total_value))
    setEditOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProject.mutateAsync({
      id,
      dto: {
        name: editName || undefined,
        description: editDesc || undefined,
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
        total_value: editTotalValue ? parseFloat(editTotalValue) : undefined,
      },
    })
    setEditOpen(false)
  }

  const handleDeleteProject = async () => {
    if (!confirm(`Deseja realmente excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`)) return
    await deleteProject.mutateAsync(id)
    router.push('/projects')
  }

  const handleStatusChange = async (status: string) => {
    await updateProject.mutateAsync({ id, dto: { status: status as never } })
    setNewStatus('')
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    const dto: AddProjectServiceDto = {
      service_id: svcServiceId,
      quantity: parseFloat(svcQty),
      unit_price: parseFloat(svcPrice),
      description: svcDesc || undefined,
    }
    await addService.mutateAsync({ projectId: id, dto })
    setAddServiceOpen(false)
    setSvcServiceId(''); setSvcQty('1'); setSvcPrice(''); setSvcDesc('')
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const dto: CreatePaymentDto = {
      project_id: id,
      amount: parseFloat(pmtAmount),
      due_date: pmtDueDate,
      payment_method: pmtMethod || undefined,
      notes: pmtNotes || undefined,
    }
    await createPayment.mutateAsync(dto)
    setAddPaymentOpen(false)
    setPmtAmount(''); setPmtDueDate(''); setPmtMethod(''); setPmtNotes('')
  }

  const handleOpenPay = (paymentId: string) => {
    setPayingId(paymentId)
    setPaidDate(new Date().toISOString().slice(0, 10))
    setPayModalOpen(true)
  }

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault()
    await payPayment.mutateAsync({ id: payingId, paid_date: paidDate })
    setPayModalOpen(false)
    setPayingId('')
    setPaidDate('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="sm">← Voltar</Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[project.status] ?? ''}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
        {!isFinished && (
          <Button variant="secondary" size="sm" onClick={handleOpenEdit}>Editar</Button>
        )}
        <ContractDownloadButton
          project={project as typeof project & { services: ProjectService[] }}
          customerName={customerName}
          payments={payments}
        />
        <Button variant="danger" size="sm" loading={deleteProject.isPending} onClick={handleDeleteProject}>Excluir Projeto</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Início</p>
          <p className="mt-1 text-sm text-gray-900">{project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Previsão de conclusão</p>
          <p className="mt-1 text-sm text-gray-900">{project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Valor Total</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{project.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>

        {!isFinished && (
          <div className="col-span-3 flex items-center gap-3">
            <Select
              options={STATUS_OPTIONS}
              value={newStatus || project.status}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-48"
            />
            {newStatus && newStatus !== project.status && (
              <Button size="sm" loading={updateProject.isPending} onClick={() => handleStatusChange(newStatus)}>
                Atualizar Status
              </Button>
            )}
          </div>
        )}
        {isFinished && (
          <div className="col-span-3 rounded-md bg-gray-50 px-4 py-2 text-sm text-gray-500">
            Projeto finalizado — edição bloqueada
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {(['services', 'payments'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {t === 'services' ? `Serviços (${services.length})` : `Pagamentos (${payments.length})`}
          </button>
        ))}
      </div>

      {tab === 'services' && (
        <div className="flex flex-col gap-4">
          {!isFinished && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddServiceOpen(true)}>+ Adicionar Serviço</Button>
            </div>
          )}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Serviço</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Qtd</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Preço unit.</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                  {!isFinished && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-400">Nenhum serviço adicionado</td></tr>
                )}
                {services.map((svc: ProjectService) => (
                  <tr key={svc.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="font-medium">{svc.service_name}</span>
                      {svc.description && <span className="ml-2 text-gray-500">— {svc.description}</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">{svc.quantity}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">{svc.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{svc.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    {!isFinished && (
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="danger" onClick={() => removeService.mutateAsync({ id: svc.id, projectId: id })}>Remover</Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAddPaymentOpen(true)}>+ Adicionar Pagamento</Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">Nenhum pagamento cadastrado</td></tr>
                )}
                {payments.map((pmt) => (
                  <tr key={pmt.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(pmt.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pmt.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {pmt.status === 'paid' ? `Pago em ${new Date(pmt.paid_date!).toLocaleDateString('pt-BR')}` : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{pmt.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-6 py-4 text-right">
                      {pmt.status === 'pending' && (
                        <Button size="sm" onClick={() => handleOpenPay(pmt.id)}>Marcar como Pago</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={payModalOpen} title="Registrar Pagamento" onClose={() => setPayModalOpen(false)}>
        <form onSubmit={handleConfirmPay} className="flex flex-col gap-4">
          <Input label="Data de Pagamento *" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setPayModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={payPayment.isPending}>Confirmar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} title="Editar Projeto" onClose={() => setEditOpen(false)}>
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
          <Input label="Nome *" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Input label="Descrição" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de Início" type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
            <Input label="Previsão de Conclusão" type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={updateProject.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={addServiceOpen} title="Adicionar Serviço" onClose={() => setAddServiceOpen(false)}>
        <form onSubmit={handleAddService} className="flex flex-col gap-4">
          <Select label="Serviço *" options={serviceOptions} placeholder="Selecione..." value={svcServiceId} onChange={(e) => { const s = (catalog ?? []).find((x) => x.id === e.target.value); setSvcServiceId(e.target.value); if (s?.current_price) setSvcPrice(String(s.current_price.price_per_unit)) }} required />
          <Input label="Quantidade *" type="number" min="0.01" step="0.01" value={svcQty} onChange={(e) => setSvcQty(e.target.value)} required />
          <Input label="Preço unitário *" type="number" min="0" step="0.01" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} required />
          <Input label="Descrição" value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setAddServiceOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={addService.isPending}>Adicionar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={addPaymentOpen} title="Adicionar Pagamento" onClose={() => setAddPaymentOpen(false)}>
        <form onSubmit={handleAddPayment} className="flex flex-col gap-4">
          <Input label="Valor *" type="number" min="0.01" step="0.01" value={pmtAmount} onChange={(e) => setPmtAmount(e.target.value)} required />
          <Input label="Vencimento *" type="date" value={pmtDueDate} onChange={(e) => setPmtDueDate(e.target.value)} required />
          <Input label="Forma de Pagamento" value={pmtMethod} onChange={(e) => setPmtMethod(e.target.value)} />
          <Input label="Observações" value={pmtNotes} onChange={(e) => setPmtNotes(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setAddPaymentOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createPayment.isPending}>Adicionar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
