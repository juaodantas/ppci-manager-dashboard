import type { IAuthRepository } from '../../../domain/repositories/auth.repository'
import type { IAuthTokenPort } from '../../ports/auth-token.port'

export class RefreshTokenUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenPort: IAuthTokenPort,
  ) {}

  async execute(): Promise<string> {
    const refreshToken = this.tokenPort.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token available')

    const { access_token } = await this.authRepo.refresh(refreshToken)
    this.tokenPort.setToken(access_token)
    return access_token
  }
}
