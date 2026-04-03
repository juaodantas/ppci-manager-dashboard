import { describe, it, expect, vi } from 'vitest'
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case'
import type { IAuthRepository } from '../../domain/repositories/auth.repository'
import type { IAuthTokenPort } from '../../application/ports/auth-token.port'

function makeAuthRepo(accessToken = 'jwt-token', refreshToken = 'refresh-token'): IAuthRepository {
  return {
    login: vi.fn().mockResolvedValue({ access_token: accessToken, refresh_token: refreshToken }),
    register: vi.fn().mockResolvedValue({ access_token: accessToken, refresh_token: refreshToken }),
    refresh: vi.fn().mockResolvedValue({ access_token: accessToken }),
    logout: vi.fn().mockResolvedValue(undefined),
  }
}

function makeTokenPort(): IAuthTokenPort {
  return {
    getToken: vi.fn(),
    setToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clear: vi.fn(),
  }
}

describe('LoginUseCase', () => {
  it('calls authRepo.login with the provided credentials', async () => {
    const authRepo = makeAuthRepo()
    const tokenPort = makeTokenPort()
    const useCase = new LoginUseCase(authRepo, tokenPort)

    await useCase.execute('user@example.com', 'secret')

    expect(authRepo.login).toHaveBeenCalledWith('user@example.com', 'secret')
  })

  it('stores the returned access_token and refresh_token via tokenPort', async () => {
    const authRepo = makeAuthRepo('my-jwt', 'my-refresh')
    const tokenPort = makeTokenPort()
    const useCase = new LoginUseCase(authRepo, tokenPort)

    await useCase.execute('user@example.com', 'secret')

    expect(tokenPort.setToken).toHaveBeenCalledWith('my-jwt')
    expect(tokenPort.setRefreshToken).toHaveBeenCalledWith('my-refresh')
  })

  it('propagates errors thrown by authRepo.login', async () => {
    const authRepo = makeAuthRepo()
    authRepo.login = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
    const tokenPort = makeTokenPort()
    const useCase = new LoginUseCase(authRepo, tokenPort)

    await expect(useCase.execute('user@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    expect(tokenPort.setToken).not.toHaveBeenCalled()
  })
})
