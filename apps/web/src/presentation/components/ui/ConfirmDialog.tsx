'use client'

import { useId } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const autoId = useId()
  const fallbackDescriptionId = description ? undefined : `confirm-dialog-description-${autoId}`

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      descriptionId={fallbackDescriptionId}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? null : (
        <p id={fallbackDescriptionId} className="text-sm text-slate-600">
          Esta ação não pode ser desfeita.
        </p>
      )}
    </Modal>
  )
}
