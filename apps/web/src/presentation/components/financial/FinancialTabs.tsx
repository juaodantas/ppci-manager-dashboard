'use client'

export type FinancialTab = 'entries' | 'fixed-costs' | 'variable-costs' | 'graphs'

const tabs: { id: FinancialTab; label: string }[] = [
  { id: 'entries', label: 'Lançamentos' },
  { id: 'fixed-costs', label: 'Custos Fixos' },
  { id: 'variable-costs', label: 'Custos Variáveis' },
  { id: 'graphs', label: 'Gráficos' },
]

export function FinancialTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: FinancialTab
  onTabChange: (tab: FinancialTab) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200" role="tablist" aria-label="Abas do financeiro">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`financial-tab-${tab.id}`}
          aria-controls={`financial-panel-${tab.id}`}
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
