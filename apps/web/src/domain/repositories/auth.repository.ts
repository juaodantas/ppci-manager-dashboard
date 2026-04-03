export interface IAuthRepository {
  login(email: string, password: string): Promise<{ access_token: string; refresh_token: string }>
  register(name: string, email: string, password: string): Promise<{ access_token: string; refresh_token: string }>
  refresh(refreshToken: string): Promise<{ access_token: string }>
  logout(refreshToken: string): Promise<void>
}
