'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../presentation/contexts/auth.context'
import { Input } from '../../../presentation/components/ui/Input'
import { Button } from '../../../presentation/components/ui/Button'

export default function RegisterPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
    } catch {
      setError('Não foi possível criar a conta. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Criar Conta</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Criar Conta
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
