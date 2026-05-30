import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '../presentation/providers/QueryProvider'
import { AuthProvider } from '../presentation/contexts/auth.context'
import { ThemeProvider } from '../presentation/contexts/theme.context'

export const metadata: Metadata = {
  title: 'PPCI Manager Dashboard',
  description: 'Dashboard profissional para gerenciamento de serviços, clientes e projetos PPCI.',
}

const themeScript = `
try {
  var theme = window.localStorage.getItem('ppci-manager-theme');
  var nextTheme = theme === 'dark' || theme === 'light' ? theme : 'light';
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
} catch (error) {
  document.documentElement.dataset.theme = 'light';
  document.documentElement.classList.remove('dark');
}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
