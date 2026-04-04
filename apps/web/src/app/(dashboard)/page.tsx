'use client'

import Link from 'next/link'
import { useProjects } from '../../presentation/hooks/useProjects'
import { useQuotes } from '../../presentation/hooks/useQuotes'
import { useCustomers } from '../../presentation/hooks/useCustomers'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data: projectsData } = useProjects({ limit: 100 })
  const { data: quotesData } = useQuotes({ limit: 100 })
  const { data: customersData } = useCustomers({ limit: 100 })

  const totalProjects = projectsData?.total ?? 0
  const inProgressProjects = (projectsData?.projects ?? []).filter((p) => p.status === 'in_progress').length
  const totalQuotes = quotesData?.total ?? 0
  const totalCustomers = customersData?.total ?? 0

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Clientes" value={totalCustomers} />
        <StatCard label="Projetos" value={totalProjects} />
        <StatCard label="Em Andamento" value={inProgressProjects} />
        <StatCard label="Orçamentos" value={totalQuotes} />
      </div>

      <div className="flex gap-4">
        <Link
          href="/customers"
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          Ver Clientes →
        </Link>
        <Link
          href="/projects"
          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Ver Projetos →
        </Link>
        <Link
          href="/quotes"
          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Ver Orçamentos →
        </Link>
      </div>
    </div>
  )
}
