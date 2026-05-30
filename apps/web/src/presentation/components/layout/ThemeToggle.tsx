'use client'

import { useTheme } from '../../contexts/theme.context'

interface ThemeToggleProps {
  className?: string
  variant?: 'default' | 'compact'
}

export function ThemeToggle({ className = '', variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'
  const content = variant === 'compact'
    ? (
      <span className="flex items-center gap-2">
        <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
        <span className="hidden sm:inline">{isDark ? 'Escuro' : 'Claro'}</span>
      </span>
    )
    : (
      <>
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
          <span>{isDark ? 'Tema escuro' : 'Tema claro'}</span>
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400" aria-hidden="true">
          {isDark ? 'Claro' : 'Escuro'}
        </span>
      </>
    )

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      className={`inline-flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${className}`}
    >
      {content}
    </button>
  )
}
