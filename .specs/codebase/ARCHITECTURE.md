# Architecture

**Analyzed:** 2026-03-31
**Updated:** 2026-04-02

## Padrão Atual

Monorepo Turborepo com Clean Architecture em ambos os apps. Backend migrado de NestJS/Railway para Hono + Supabase Edge Functions.

---

## Backend (supabase/functions/api)

**Padrão:** Hono + Clean Architecture — Routes → Use Cases → Repositories (SQL puro)
**Runtime:** Deno (Supabase Edge Functions)

### Camadas

```
Route Handler (Hono) → Use Case → Repository (SQL direto)
```

### Estrutura de Arquivos

```
supabase/
├── config.toml
├── migrations/
│   └── 20240101000000_initial.sql
└── functions/
    ├── _shared/
    │   └── domain/               ← fonte da verdade (entidades, VOs, exceções)
    │       ├── entities/
    │       ├── value-objects/
    │       └── exceptions/
    └── api/
        ├── index.ts              ← Hono app entry point (serve via Deno)
        ├── routes/
        │   ├── auth.ts           ← POST /auth/register, /auth/login
        │   ├── users.ts          ← CRUD /users
        │   └── services.ts       ← CRUD /services
        ├── repositories/
        │   ├── user.repository.ts     ← SQL direto, sem ORM
        │   └── service.repository.ts
        ├── use-cases/
        │   ├── user/
        │   └── service/
        ├── middleware/
        │   └── auth.ts            ← JWT guard (Hono middleware)
        ├── db.ts                  ← instância postgres (postgresjs Deno)
        └── validation/            ← Schemas Zod
```

> **Domain compartilhado:** `_shared/domain/` é a fonte da verdade. A Edge Function importa via path relativo (`../_shared/domain/`). O frontend resolve `@manager/domain` apontando para o mesmo diretório via `tsconfig.json` paths. Sem symlinks, sem duplicação.

### Entry Point

```typescript
// supabase/functions/api/index.ts
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'

const app = new Hono().basePath('/api')

app.use('*', cors({ origin: Deno.env.get('CORS_ORIGIN') ?? '*' }))
app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/auth', authRoutes)
app.route('/users', userRoutes)
app.route('/services', serviceRoutes)

Deno.serve(app.fetch)
```

### Auth Middleware

```typescript
// middleware/auth.ts
import { jwt } from 'npm:hono/jwt'

const secret = Deno.env.get('JWT_SECRET')
if (!secret) throw new Error('JWT_SECRET environment variable is required')

export const authMiddleware = jwt({ secret, alg: 'HS256' })
```

### Repository (SQL direto)

```typescript
// repositories/user.repository.ts
import sql from '../db.ts'

export const UserRepository = {
  async findByEmail(email: string) {
    const [row] = await sql`SELECT * FROM users WHERE email = ${email}`
    return row ?? null
  },
  async create(data: { name: string; email: string; passwordHash: string }) {
    const [row] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${data.name}, ${data.email}, ${data.passwordHash})
      RETURNING *
    `
    return row
  },
  // findById, update, delete...
}
```

---

## Frontend (apps/web)

**Padrão:** Clean Architecture — Use Cases → HTTP Repositories → Next.js pages

```
Page (Next.js App Router) → Hook → Use Case → HTTP Repository → API
```

### Camadas

```
src/
├── domain/                    ← tipos e interfaces (sem dependências externas)
├── application/use-cases/     ← lógica de negócio pura
├── infrastructure/
│   ├── http/                  ← repositories HTTP (Axios)
│   ├── storage/               ← token storage (localStorage)
│   └── di/                    ← container de injeção (factory functions)
└── presentation/
    ├── app/                   ← Next.js App Router (pages, layouts)
    ├── components/            ← UI components
    ├── hooks/                 ← cola entre use cases e componentes
    └── contexts/              ← auth context
```

---

## Fluxo de Dados

```
Browser → Next.js Page → Hook → Use Case → Axios → Hono (Edge) → SQL → Supabase PostgreSQL
```

---

## Separação de Responsabilidades

| Camada       | Backend (Hono/Deno)          | Frontend (Next.js)            |
|--------------|------------------------------|-------------------------------|
| Domínio      | `_shared/domain/` (fonte)    | Re-exporta `_shared/domain/` via alias `@manager/domain` |
| Casos de Uso | Use case functions           | Use case classes              |
| Infra/HTTP   | SQL repositories (postgres)  | HTTP repositories (Axios)     |
| Apresentação | Hono route handlers          | Pages + Components            |
| Auth         | JWT middleware (Hono)        | Auth context + localStorage   |
