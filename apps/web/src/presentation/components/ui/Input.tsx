'use client'

import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
}

export function Input({ label, error, description, className = '', id, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? `input-${autoId}`
  const errorId = error ? `${inputId}-error` : undefined
  const descriptionId = description ? `${inputId}-description` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined
  const hasAccessibleLabel = Boolean(label || props['aria-label'])

  if (!hasAccessibleLabel) {
    throw new Error('Input requires label or aria-label')
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-offset-slate-950 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 ${error ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-700'} ${className}`}
        {...props}
      />
      {description && (
          <p id={descriptionId} className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
