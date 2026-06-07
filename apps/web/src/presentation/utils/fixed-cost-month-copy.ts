import type {
  FixedCostMonthlyLine,
  FixedCostMonthlyLineEditBlockReason,
} from '../../domain/repositories/fixed-cost-month.repository'

export const fixedCostMonthReasonMessages: Record<FixedCostMonthlyLineEditBlockReason, string> = {
  month_closed: 'Este mês está fechado para edição comum.',
  before_start_date: 'Este custo começa depois do mês selecionado.',
  after_end_date: 'Este custo terminou antes do mês selecionado.',
  inactive: 'Este custo está inativo no cadastro recorrente.',
}

export function getFixedCostMonthStatusLabel(line: FixedCostMonthlyLine): string | null {
  if (line.status === 'closed') return 'Fechado'
  if (line.status === 'edited') return 'Editado neste mês'
  return null
}

export function getFixedCostMonthStatusMicrocopy(line: FixedCostMonthlyLine): string | null {
  if (line.status === 'closed') return 'Edição comum indisponível.'
  if (line.status === 'edited') return 'Valor ajustado manualmente neste mês.'
  return null
}

export function getFixedCostMonthLegacyMicrocopy(line: FixedCostMonthlyLine): string | null {
  if (line.base_relation_status !== 'snapshot_only') return null
  return 'Valor salvo neste mês, mesmo fora do cadastro recorrente atual.'
}
