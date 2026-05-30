'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../presentation/contexts/auth.context'
import { Input } from '../../../presentation/components/ui/Input'
import { Button } from '../../../presentation/components/ui/Button'
import { registerSchema } from '../../../application/validation/auth.schemas'

export default function RegisterPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})

    const result = registerSchema.safeParse({ name, email, password })
    if (!result.success) {
      const fieldErrors: { name?: string; email?: string; password?: string } = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as 'name' | 'email' | 'password'
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      await register(result.data.name, result.data.email, result.data.password)
    } catch {
      setError('Não foi possível criar a conta. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-slate-950">
      <main
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        aria-labelledby="register-title"
      >
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Comece agora</p>
          <h1 id="register-title" className="mt-2 text-2xl font-semibold text-gray-900 dark:text-slate-100">
            Crie sua conta
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Organize seus projetos e mantenha seus clientes informados.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            name="name"
            spellCheck={false}
            error={errors.name}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            name="email"
            spellCheck={false}
            error={errors.email}
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            name="password"
            spellCheck={false}
            description="Use no mínimo 6 caracteres para manter sua conta segura."
            error={errors.password}
          />
          <div aria-live="assertive" className="min-h-[1.5rem] text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
          <Button type="submit" loading={loading} className="mt-1 w-full">
            Criar Conta
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-600 dark:text-slate-300">
          Já tem conta?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-blue-300 dark:focus-visible:ring-offset-slate-900"
          >
            Entrar
          </Link>
        </p>
      </main>
    </div>
  )
}
