import sql from '../db.ts'
import { User } from '../../_shared/domain/entities/user.entity.ts'
import { Email } from '../../_shared/domain/value-objects/email.vo.ts'

// deno-lint-ignore no-explicit-any
function toUser(row: Record<string, any>): User {
  return new User(
    row.id as string,
    row.name as string,
    new Email(row.email as string),
    row.password_hash as string,
    new Date(row.created_at as string),
    new Date(row.updated_at as string),
  )
}

export const UserRepository = {
  async findById(id: string): Promise<User | null> {
    const rows = await sql`SELECT * FROM users WHERE id = ${id}`
    return rows.length > 0 ? toUser(rows[0]) : null
  },

  async findByEmail(email: string): Promise<User | null> {
    const rows = await sql`SELECT * FROM users WHERE email = ${email}`
    return rows.length > 0 ? toUser(rows[0]) : null
  },

  async findAll(): Promise<User[]> {
    const rows = await sql`SELECT * FROM users ORDER BY created_at DESC`
    return rows.map(toUser)
  },

  async findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<{ users: User[]; total: number }> {
    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM users
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    const total = rows.length > 0 ? (rows[0].total_count as number) : 0
    return { users: rows.map(toUser), total }
  },

  async save(user: User): Promise<User> {
    const rows = await sql`
      INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
      VALUES (
        ${user.id},
        ${user.name},
        ${user.email.value},
        ${user.passwordHash},
        ${user.createdAt.toISOString()},
        ${user.updatedAt.toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        name         = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        updated_at   = EXCLUDED.updated_at
      RETURNING *
    `
    return toUser(rows[0])
  },

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM users WHERE id = ${id}`
  },
}
