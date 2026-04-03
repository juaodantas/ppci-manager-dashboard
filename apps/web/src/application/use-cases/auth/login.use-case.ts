import type { IAuthRepository } from '../../../domain/repositories/auth.repository'
import type { IAuthTokenPort } from '../../ports/auth-token.port'

export class LoginUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenPort: IAuthTokenPort,
  ) {}

  async execute(email: string, password: string): Promise<void> {
    const { access_token, refresh_token } = await this.authRepo.login(email, password)
    this.tokenPort.setToken(access_token)
    this.tokenPort.setRefreshToken(refresh_token)
  }
}
