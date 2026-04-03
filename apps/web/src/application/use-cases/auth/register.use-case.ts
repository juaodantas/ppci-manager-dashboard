import type { IAuthRepository } from '../../../domain/repositories/auth.repository'
import type { IAuthTokenPort } from '../../ports/auth-token.port'

export class RegisterUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenPort: IAuthTokenPort,
  ) {}

  async execute(name: string, email: string, password: string): Promise<void> {
    const { access_token, refresh_token } = await this.authRepo.register(name, email, password)
    this.tokenPort.setToken(access_token)
    this.tokenPort.setRefreshToken(refresh_token)
  }
}
