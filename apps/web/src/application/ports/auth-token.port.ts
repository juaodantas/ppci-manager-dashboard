export interface IAuthTokenPort {
  getToken(): string | null
  setToken(token: string): void
  getRefreshToken(): string | null
  setRefreshToken(token: string): void
  clear(): void
}
