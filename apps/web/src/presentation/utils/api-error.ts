import type { FixedCostMonthlyLineEditBlockReason } from '../../domain/repositories/fixed-cost-month.repository'
import { fixedCostMonthReasonMessages } from './fixed-cost-month-copy'

type ApiErrorData = {
  error?: string
  message?: string
  reason?: string
}

type ApiErrorResponse = {
  data?: ApiErrorData
}

type ErrorWithResponse = {
  response?: ApiErrorResponse
}

type ErrorWithMessage = {
  message?: string
}

function readApiErrorData(error: unknown): ApiErrorData | undefined {
  if (!error || typeof error !== 'object') return undefined
  const withResponse = error as ErrorWithResponse
  return withResponse.response?.data
}

function readApiErrorReason(error: unknown): string | undefined {
  return readApiErrorData(error)?.reason
}

function isFixedCostMonthReason(reason: string): reason is FixedCostMonthlyLineEditBlockReason {
  return Object.prototype.hasOwnProperty.call(fixedCostMonthReasonMessages, reason)
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiErrorData = readApiErrorData(error)
  if (apiErrorData) {
    const message = apiErrorData.error ?? apiErrorData.message
    if (message) return message
  }

  if (error && typeof error === 'object') {
    const withMessage = error as ErrorWithMessage
    if (withMessage.message) return withMessage.message
  }

  return fallback
}

export function getFixedCostMonthApiErrorMessage(error: unknown, fallback: string): string {
  const reason = readApiErrorReason(error)
  if (reason && isFixedCostMonthReason(reason)) {
    return fixedCostMonthReasonMessages[reason]
  }

  return fallback
}
