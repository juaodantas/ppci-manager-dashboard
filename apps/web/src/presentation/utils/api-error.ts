type ErrorResponse = {
  data?: {
    error?: string
    message?: string
  }
}

type ErrorWithResponse = {
  response?: ErrorResponse
}

type ErrorWithMessage = {
  message?: string
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const withResponse = error as ErrorWithResponse
    const message = withResponse.response?.data?.error ?? withResponse.response?.data?.message
    if (message) return message

    const withMessage = error as ErrorWithMessage
    if (withMessage.message) return withMessage.message
  }

  return fallback
}
