import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { authRoutes } from './routes/auth.ts'
import { userRoutes } from './routes/users.ts'
import { serviceRoutes } from './routes/services.ts'

const functionName = 'api'
const app = new Hono().basePath(`/${functionName}`)

app.use(
  '*',
  cors({
    origin: Deno.env.get('CORS_ORIGIN') ?? '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', authRoutes)
app.route('/users', userRoutes)
app.route('/services', serviceRoutes)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

Deno.serve(app.fetch)
