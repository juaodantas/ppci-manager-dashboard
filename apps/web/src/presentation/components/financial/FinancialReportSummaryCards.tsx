'use client'

export function FinancialReportSummaryCards({
  report,
  loading,
}: {
  report?: { total_income: number; total_expense: number; balance: number } | null
  loading: boolean
}) {
  if (loading) {
    return <div className="py-8 text-center text-gray-500" aria-live="polite">Carregando relatório…</div>
  }

  if (!report) return null

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Receitas</p>
        <p className="mt-2 text-2xl font-bold text-green-600">{report.total_income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Despesas</p>
        <p className="mt-2 text-2xl font-bold text-red-600">{report.total_expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs font-medium uppercase text-gray-500">Saldo</p>
        <p className={`mt-2 text-2xl font-bold ${report.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {report.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>
    </div>
  )
}
