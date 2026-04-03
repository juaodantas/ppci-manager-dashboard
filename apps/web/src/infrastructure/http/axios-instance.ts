import axios from 'axios'
import type { IAuthTokenPort } from '../../application/ports/auth-token.port'

export function createAxiosInstance(tokenPort: IAuthTokenPort, onRefresh: () => Promise<string>) {
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

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config
      if (error.response?.status === 401 && !original._retry && typeof window !== 'undefined') {
        original._retry = true
        try {
          const newToken = await onRefresh()
          original.headers.Authorization = `Bearer ${newToken}`
          return instance(original)
        } catch {
          tokenPort.clear()
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    },
  )

  return instance
}
