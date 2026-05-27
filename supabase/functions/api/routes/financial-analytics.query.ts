export function resolveHorizonMonths(rawValue: string | undefined): number {
  if (rawValue == null || rawValue === '') return 12

  const value = Number(rawValue)
  if (!Number.isInteger(value) || value < 1 || value > 12) {
    throw new Error('horizon_months must be an integer between 1 and 12')
  }

  return value
}
