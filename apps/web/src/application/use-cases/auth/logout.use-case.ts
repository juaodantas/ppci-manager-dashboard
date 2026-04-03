import type { IAuthRepository } from '../../../domain/repositories/auth.repository'
import type { IAuthTokenPort } from '../../ports/auth-token.port'

export class LogoutUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenPort: IAuthTokenPort,
  ) {}

  async execute(): Promise<void> {
    const refreshToken = this.tokenPort.getRefreshToken()
    if (refreshToken) {
      await this.authRepo.logout(refreshToken).catch(() => {})
    }
    this.tokenPort.clear()
  }
}
