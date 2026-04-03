import { jwt } from 'npm:hono/jwt'

const secret = Deno.env.get('JWT_SECRET')
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required and not set')
}

export const authMiddleware = jwt({ secret, alg: 'HS256' })
