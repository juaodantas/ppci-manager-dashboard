import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '../presentation/providers/QueryProvider'
import { AuthProvider } from '../presentation/contexts/auth.context'

export const metadata: Metadata = {
  title: 'Manager Dashboard',
  description: 'Gerenciamento de serviços e usuários',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
