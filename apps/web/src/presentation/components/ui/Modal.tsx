'use client'

import { useEffect, useId, useMemo, useRef } from 'react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  description?: string
  descriptionId?: string
}

const focusableSelectors = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const isAriaHidden = (element: HTMLElement) => element.closest('[aria-hidden="true"]') !== null

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return []
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => !el.hasAttribute('disabled') && !isAriaHidden(el)
  )
}

const lockBodyScroll = () => {
  const body = document.body
  const previousOverflow = body.style.overflow
  const previousPaddingRight = body.style.paddingRight
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth

  body.style.overflow = 'hidden'
  if (scrollBarWidth > 0) {
    body.style.paddingRight = `${scrollBarWidth}px`
  }

  return { previousOverflow, previousPaddingRight }
}

const lockScrollRoot = () => {
  const scrollRoot = document.querySelector<HTMLElement>('[data-scroll-lock-root="true"]')

  if (!scrollRoot) {
    return null
  }

  const previousOverflow = scrollRoot.style.overflow
  scrollRoot.style.overflow = 'hidden'

  return { scrollRoot, previousOverflow }
}

export function Modal({ open, title, onClose, children, footer, description, descriptionId }: ModalProps) {
  const dialogId = useId()
  const titleId = useMemo(() => `${dialogId}-title`, [dialogId])
  const resolvedDescriptionId = description ? `${dialogId}-description` : descriptionId
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const bodyOverflowRef = useRef<string | null>(null)
  const bodyPaddingRef = useRef<string | null>(null)
  const scrollRootRef = useRef<{ scrollRoot: HTMLElement; previousOverflow: string } | null>(null)

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const { previousOverflow, previousPaddingRight } = lockBodyScroll()
    bodyOverflowRef.current = previousOverflow
    bodyPaddingRef.current = previousPaddingRight
    scrollRootRef.current = lockScrollRoot()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab') return
      const focusable = getFocusableElements(dialogRef.current)
      if (!focusable.length) {
        e.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      const isOutside = !active || !dialogRef.current?.contains(active)

      if (e.shiftKey) {
        if (active === first || isOutside) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || isOutside) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('keydown', handleKey)
      const body = document.body

      if (bodyOverflowRef.current !== null) {
        body.style.overflow = bodyOverflowRef.current
      }

      if (bodyPaddingRef.current !== null) {
        body.style.paddingRight = bodyPaddingRef.current
      }

      if (scrollRootRef.current) {
        scrollRootRef.current.scrollRoot.style.overflow = scrollRootRef.current.previousOverflow
      }

      bodyOverflowRef.current = null
      bodyPaddingRef.current = null
      scrollRootRef.current = null
      restoreFocusRef.current?.focus()
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const focusable = getFocusableElements(dialogRef.current)
    const initialFocus = focusable[0] ?? dialogRef.current
    initialFocus?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={resolvedDescriptionId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar modal">
            ✕
          </Button>
        </div>
        {description && (
          <p id={resolvedDescriptionId} className="px-6 pt-4 text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">{footer}</div>}
      </div>
    </div>
  )
}
