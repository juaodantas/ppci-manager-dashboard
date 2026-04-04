import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { authRoutes } from './routes/auth.ts'
import { userRoutes } from './routes/users.ts'
import { customerRoutes } from './routes/customers.ts'
import { serviceCatalogRoutes } from './routes/service-catalog.ts'
import { quoteRoutes } from './routes/quotes.ts'
import { projectRoutes, projectServiceRoutes } from './routes/projects.ts'
import { paymentRoutes } from './routes/payments.ts'
import { fixedCostRoutes } from './routes/fixed-costs.ts'
import { financialRoutes } from './routes/financial.ts'

const functionName = 'api'
const app = new Hono().basePath(`/${functionName}`)

app.use(
  '*',
  cors({
    origin: Deno.env.get('CORS_ORIGIN') ?? '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', authRoutes)
app.route('/users', userRoutes)
app.route('/customers', customerRoutes)
app.route('/service-catalog', serviceCatalogRoutes)
app.route('/quotes', quoteRoutes)
app.route('/projects', projectRoutes)
app.route('/project-services', projectServiceRoutes)
app.route('/payments', paymentRoutes)
app.route('/fixed-costs', fixedCostRoutes)
app.route('/financial', financialRoutes)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

Deno.serve(app.fetch)
