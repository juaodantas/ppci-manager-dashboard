export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function notFound(resource: string, id: string): HttpError {
  return new HttpError(404, `${resource} with id "${id}" not found`)
}

export function conflict(message: string): HttpError {
  return new HttpError(409, message)
}

export function unauthorized(message = 'Invalid credentials'): HttpError {
  return new HttpError(401, message)
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message)
}
