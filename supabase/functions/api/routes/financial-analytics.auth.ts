type JwtPayload = {
  company_id?: string
  company_ids?: string[]
}

export function readCompanyScope(payload: JwtPayload): string[] | null {
  if (Array.isArray(payload.company_ids) && payload.company_ids.length > 0) {
    return payload.company_ids
  }
  if (typeof payload.company_id === 'string' && payload.company_id.length > 0) {
    return [payload.company_id]
  }
  return null
}

export function isCompanyInScope(payload: JwtPayload, companyId: string): boolean {
  const scope = readCompanyScope(payload)
  if (!scope) return true
  return scope.includes(companyId)
}
