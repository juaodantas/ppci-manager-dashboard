'use client'

export function FinancialTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: 'overview' | 'graphs'
  onTabChange: (tab: 'overview' | 'graphs') => void
}) {
  return (
    <div className="flex gap-1 border-b border-gray-200" role="tablist" aria-label="Abas do financeiro">
      <button
        type="button"
        role="tab"
        id="financial-tab-overview"
        aria-controls="financial-panel-overview"
        aria-selected={activeTab === 'overview'}
        onClick={() => onTabChange('overview')}
        className={`px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
      >
        Visão geral
      </button>
      <button
        type="button"
        role="tab"
        id="financial-tab-graphs"
        aria-controls="financial-panel-graphs"
        aria-selected={activeTab === 'graphs'}
        onClick={() => onTabChange('graphs')}
        className={`px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${activeTab === 'graphs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
      >
        Gráficos
      </button>
    </div>
  )
}
