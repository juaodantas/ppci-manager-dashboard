import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { IAuthTokenPort } from '../../application/ports/auth-token.port'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface AxiosInstanceOptions {
  onSessionExpired?: () => void
}

export function createAxiosInstance(
  tokenPort: IAuthTokenPort,
  onRefresh: () => Promise<string>,
  options: AxiosInstanceOptions = {},
) {
  const instance = axios.create({
    baseURL:
      process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:54321/functions/v1/api',
    timeout: 10000,
  })

  instance.interceptors.request.use((config) => {
    const token = tokenPort.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Serializes concurrent refresh attempts so only one runs at a time
  let refreshPromise: Promise<string> | null = null

  function notifySessionExpired() {
    tokenPort.clear()
    options.onSessionExpired?.()
  }

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableRequestConfig | undefined

      // Never interfere with auth endpoints (login, register, refresh)
      if (original?.url?.includes('/auth/')) {
        return Promise.reject(error)
      }

      if (error.response?.status === 401 && original && !original._retry) {
        original._retry = true
        try {
          // Reuse an in-flight refresh so parallel 401s don't trigger multiple refreshes
          if (!refreshPromise) {
            refreshPromise = onRefresh().finally(() => { refreshPromise = null })
          }
          const newToken = await refreshPromise
          original.headers.Authorization = `Bearer ${newToken}`
          return instance(original)
        } catch (refreshError) {
          notifySessionExpired()
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    },
  )

  return instance
}
