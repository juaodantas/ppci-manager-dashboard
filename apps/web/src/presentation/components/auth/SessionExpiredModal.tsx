'use client'

import { useState } from 'react'
import { loginSchema } from '../../../application/validation/auth.schemas'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

interface SessionExpiredModalProps {
  open: boolean
  onReauthenticate: (email: string, password: string) => Promise<void>
  onLogout: () => Promise<void>
}

export function SessionExpiredModal({ open, onReauthenticate, onLogout }: SessionExpiredModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setErrors({})

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (key === 'email' || key === 'password') {
          fieldErrors[key] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      await onReauthenticate(result.data.email, result.data.password)
      setPassword('')
    } catch {
      setError('Email ou senha inválidos. Seus dados na tela foram mantidos.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <Modal open={open} title="Sessão expirada" onClose={() => undefined}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Entre novamente para continuar nesta tela. A ação que falhou não será reenviada automaticamente.
        </p>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          required
          autoFocus
        />
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleLogout} loading={loggingOut} disabled={loading}>
            Sair
          </Button>
          <Button type="submit" loading={loading} disabled={loggingOut}>
            Entrar novamente
          </Button>
        </div>
      </form>
    </Modal>
  )
}
