'use client'

import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  description?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, description, options, placeholder, className = '', id, ...props }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? `select-${autoId}`
  const errorId = error ? `${selectId}-error` : undefined
  const descriptionId = description ? `${selectId}-description` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined
  const hasAccessibleLabel = Boolean(label || props['aria-label'])

  if (!hasAccessibleLabel) {
    throw new Error('Select requires label or aria-label')
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${error ? 'border-red-500' : 'border-slate-300'} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, index) => (
          <option key={`${opt.value}:${index}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {description && (
        <p id={descriptionId} className="text-xs text-slate-500">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
