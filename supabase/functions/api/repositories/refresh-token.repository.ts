import sql from '../db.ts'

export const RefreshTokenRepository = {
  async create(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days

    await sql`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
    `

    return { token, expiresAt }
  },

  async findValid(token: string): Promise<{ userId: string } | null> {
    const rows = await sql`
      SELECT user_id
      FROM refresh_tokens
      WHERE token = ${token}
        AND revoked_at IS NULL
        AND expires_at > now()
    `
    return rows.length > 0 ? { userId: rows[0].user_id as string } : null
  },

  async revoke(token: string): Promise<void> {
    await sql`
      UPDATE refresh_tokens
      SET revoked_at = now()
      WHERE token = ${token}
    `
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await sql`
      UPDATE refresh_tokens
      SET revoked_at = now()
      WHERE user_id = ${userId}
        AND revoked_at IS NULL
    `
  },
}
