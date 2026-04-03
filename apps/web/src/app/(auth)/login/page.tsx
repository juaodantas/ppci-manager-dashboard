'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../presentation/contexts/auth.context'
import { Input } from '../../../presentation/components/ui/Input'
import { Button } from '../../../presentation/components/ui/Button'
import { loginSchema } from '../../../application/validation/auth.schemas'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as 'email' | 'password'
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      await login(result.data.email, result.data.password)
    } catch {
      setError('Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Entrar</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errors.email && <p className="-mt-2 text-xs text-red-600">{errors.email}</p>}
          {errors.password && <p className="-mt-2 text-xs text-red-600">{errors.password}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Não tem conta?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
