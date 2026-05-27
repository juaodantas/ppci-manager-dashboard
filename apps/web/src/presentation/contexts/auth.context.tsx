'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { container } from '../../infrastructure/di/container'
import { SessionExpiredModal } from '../components/auth/SessionExpiredModal'

const PROACTIVE_REFRESH_INTERVAL_MS = 12 * 60 * 1000
const PUBLIC_PATHS = ['/login', '/register']

interface LoginOptions {
  redirect?: boolean
}

interface AuthContextValue {
  isAuthenticated: boolean
  loading: boolean
  sessionExpired: boolean
  login: (email: string, password: string, options?: LoginOptions) => Promise<void>
  reauthenticate: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const isPublicRoute = PUBLIC_PATHS.some((publicPath) => pathname.startsWith(publicPath))

  const handleSessionExpired = useCallback(() => {
    setIsAuthenticated(false)
    setSessionExpired(true)
  }, [])

  useEffect(() => {
    container.session.setSessionExpiredHandler(handleSessionExpired)

    return () => {
      container.session.setSessionExpiredHandler(null)
    }
  }, [handleSessionExpired])

  useEffect(() => {
    let isActive = true

    const bootstrapAuth = async () => {
      const refreshToken = container.tokenStorage.getRefreshToken()
      const accessToken = container.tokenStorage.getToken()

      if (!refreshToken) {
        if (isActive) {
          setIsAuthenticated(!!accessToken)
          setLoading(false)
        }
        return
      }

      try {
         await container.auth.refreshWithLock()
         if (isActive) {
           setIsAuthenticated(true)
         }
       } catch {
         container.tokenStorage.clear()
         if (isActive) {
           if (accessToken) {
             handleSessionExpired()
            } else {
              setIsAuthenticated(false)
              setSessionExpired(false)
              router.push('/login')
            }
         }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void bootstrapAuth()

    return () => {
      isActive = false
    }
  }, [handleSessionExpired, router])

   useEffect(() => {
     if (!isAuthenticated || !container.tokenStorage.getRefreshToken()) return

     const intervalId = window.setInterval(() => {
       void container.auth.refreshWithLock().catch(() => {
         container.tokenStorage.clear()
         handleSessionExpired()
       })
     }, PROACTIVE_REFRESH_INTERVAL_MS)

     return () => window.clearInterval(intervalId)
   }, [handleSessionExpired, isAuthenticated])

  const login = useCallback(async (email: string, password: string, options: LoginOptions = {}) => {
    await container.auth.login.execute(email, password)
    setIsAuthenticated(true)
    setSessionExpired(false)
    if (options.redirect ?? true) {
      router.push('/')
    }
  }, [router])

  const reauthenticate = useCallback(async (email: string, password: string) => {
    await container.auth.login.execute(email, password)
    setIsAuthenticated(true)
    setSessionExpired(false)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    await container.auth.register.execute(name, email, password)
    setIsAuthenticated(true)
    setSessionExpired(false)
    router.push('/')
  }, [router])

  const logout = useCallback(async () => {
    await container.auth.logout.execute()
    setIsAuthenticated(false)
    setSessionExpired(false)
    router.push('/login')
  }, [router])

  useEffect(() => {
    if (loading) return
    if (isAuthenticated) return
    if (isPublicRoute) return
    router.replace('/login')
  }, [isAuthenticated, isPublicRoute, loading, router])

  const shouldShowAuthLoading = loading && !isPublicRoute
  const shouldHidePrivateContent = !loading && !isAuthenticated && !isPublicRoute

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, sessionExpired, login, reauthenticate, register, logout }}>
      {shouldShowAuthLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-sm text-slate-500">
          Carregando...
        </div>
      ) : shouldHidePrivateContent ? null : children}
      {pathname !== '/login' && (
        <SessionExpiredModal open={sessionExpired} onReauthenticate={reauthenticate} onLogout={logout} />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
