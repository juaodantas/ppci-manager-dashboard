'use client'

import Link from 'next/link'
import { useServiceStats } from '../../presentation/hooks/useServices'
import { useUsers } from '../../presentation/hooks/useUsers'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats } = useServiceStats()
  const { data: users = [] } = useUsers()

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total de Serviços" value={stats?.total ?? 0} />
        <StatCard label="Em Andamento" value={stats?.em_andamento ?? 0} />
        <StatCard label="Concluídos" value={stats?.concluidos ?? 0} />
        <StatCard label="Usuários" value={users.length} />
      </div>


      <div className="flex gap-4">
        <Link
          href="/services"
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          Ver Serviços →
        </Link>
        <Link
          href="/users"
          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Ver Usuários →
        </Link>
      </div>
    </div>
  )
}
