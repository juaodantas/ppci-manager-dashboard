import { describe, it, expect, vi, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { createAxiosInstance } from '../infrastructure/http/axios-instance'
import type { IAuthTokenPort } from '../application/ports/auth-token.port'

function makeTokenPort(token = 'old-token'): IAuthTokenPort {
  return {
    getToken: vi.fn(() => token),
    setToken: vi.fn(),
    getRefreshToken: vi.fn(() => 'refresh-token'),
    setRefreshToken: vi.fn(),
    clear: vi.fn(),
  }
}

function makeUnauthorizedError(config: InternalAxiosRequestConfig) {
  const response: AxiosResponse = {
    data: null,
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  }

  return new AxiosError('Unauthorized', AxiosError.ERR_BAD_RESPONSE, config, undefined, response)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createAxiosInstance session expiration handling', () => {
  it('refreshes once and retries the failed request with the new token', async () => {
    let storedToken = 'old-token'
    const tokenPort = makeTokenPort()
    tokenPort.getToken = vi.fn(() => storedToken)
    const onRefresh = vi.fn().mockImplementation(() => {
      storedToken = 'new-token'
      return Promise.resolve('new-token')
    })
    const instance = createAxiosInstance(tokenPort, onRefresh)
    let calls = 0

    const adapter: AxiosAdapter = async (config) => {
      calls += 1
      if (calls === 1) {
        throw makeUnauthorizedError(config)
      }

      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }
    instance.defaults.adapter = adapter

    const response = await instance.get('/protected')

    expect(response.data).toEqual({ ok: true })
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(calls).toBe(2)
    expect(response.config.headers.Authorization).toBe('Bearer new-token')
  })

  it('clears tokens, notifies session expiration, and does not change window location on refresh failure', async () => {
    const tokenPort = makeTokenPort()
    const onRefresh = vi.fn().mockRejectedValue(new Error('refresh failed'))
    const onSessionExpired = vi.fn()
    const instance = createAxiosInstance(tokenPort, onRefresh, { onSessionExpired })
    vi.stubGlobal('window', { location: { href: '/current-page' } })

    const adapter: AxiosAdapter = async (config) => {
      throw makeUnauthorizedError(config)
    }
    instance.defaults.adapter = adapter

    await expect(instance.get('/protected')).rejects.toThrow('refresh failed')

    expect(tokenPort.clear).toHaveBeenCalledTimes(1)
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/current-page')
  })
})
