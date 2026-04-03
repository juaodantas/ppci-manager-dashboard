'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/auth.context'
import { Button } from '../ui/Button'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/services', label: 'Serviços' },
  { href: '/users', label: 'Usuários' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <span className="text-lg font-bold text-gray-900">Manager</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-56 border-t border-gray-200 p-4">
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
