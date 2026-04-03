'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { container } from '../../infrastructure/di/container'

interface AuthContextValue {
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = container.tokenStorage.getToken()
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await container.auth.login.execute(email, password)
    setIsAuthenticated(true)
    router.push('/')
  }, [router])

  const register = useCallback(async (name: string, email: string, password: string) => {
    await container.auth.register.execute(name, email, password)
    setIsAuthenticated(true)
    router.push('/')
  }, [router])

  const logout = useCallback(async () => {
    await container.auth.logout.execute()
    setIsAuthenticated(false)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
