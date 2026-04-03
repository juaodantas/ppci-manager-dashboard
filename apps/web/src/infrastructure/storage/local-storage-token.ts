import type { IAuthTokenPort } from '../../application/ports/auth-token.port'

const TOKEN_KEY = 'manager_access_token'
const REFRESH_TOKEN_KEY = 'manager_refresh_token'
const COOKIE_NAME = 'auth_token'

function setCookie(value: string) {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; SameSite=Lax`
}

function clearCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}

export class LocalStorageToken implements IAuthTokenPort {
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, token)
    setCookie(token)
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  }

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    clearCookie()
  }
}
