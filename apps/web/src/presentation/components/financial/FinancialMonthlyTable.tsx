'use client'

export function FinancialMonthlyTable({
  entries,
}: {
  entries?: { month: string; income: number; expense: number; balance: number }[]
}) {
  if (!entries || entries.length <= 1) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b px-6 py-4">
        <h2 className="font-medium text-gray-900">Por mês</h2>
      </div>
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mês</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Receitas</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Despesas</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Saldo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.map((row) => (
            <tr key={row.month}>
              <td className="px-6 py-4 text-sm text-gray-900">{new Date(row.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
              <td className="px-6 py-4 text-right text-sm text-green-600">{row.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td className="px-6 py-4 text-right text-sm text-red-600">{row.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td className={`px-6 py-4 text-right text-sm font-medium ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
