'use client'

export function FinancialEntriesTable({
  entries,
}: {
  entries?: { entries: { id: string; date: string; type: 'income' | 'expense'; description?: string | null; source_type: string; amount: number }[]; total: number }
}) {
  if (!entries || entries.entries.length === 0) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
        <h2 className="font-medium text-gray-900">Lançamentos</h2>
        <p className="text-sm text-gray-500">Mostrando {entries.entries.length} de {entries.total}</p>
      </div>
      <div className="max-h-[32rem] overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descrição</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-6 py-4 text-sm text-gray-900">{new Date(entry.date).toLocaleDateString('pt-BR')}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${entry.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {entry.type === 'income' ? 'Receita' : 'Despesa'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{entry.description ?? entry.source_type}</td>
              <td className={`px-6 py-4 text-right text-sm font-medium ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {entry.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
