import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '../presentation/providers/QueryProvider'
import { AuthProvider } from '../presentation/contexts/auth.context'

export const metadata: Metadata = {
  title: 'PPCI Manager Dashboard',
  description: 'Dashboard profissional para gerenciamento de serviços, clientes e projetos PPCI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
