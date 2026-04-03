# Project Structure

**Analyzed:** 2026-03-31
**Updated:** 2026-04-02
**Root:** `/home/joao/Documentos/personal/manager-dashboard/`

## Directory Tree

```
manager-dashboard/
├── supabase/                        ← API (Hono Edge Function) + migrations
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20240101000000_initial.sql
│   │   └── 20240102000000_add-refresh-tokens.sql
│   └── functions/
│       ├── _shared/
│       │   └── domain/              ← fonte da verdade (entidades, VOs, exceções)
│       │       ├── entities/
│       │       │   ├── user.entity.ts
│       │       │   └── service.entity.ts
│       │       ├── value-objects/
│       │       │   └── email.vo.ts
│       │       ├── exceptions/
│       │       │   └── domain.exception.ts
│       │       └── index.ts
│       └── api/
│           ├── index.ts             ← Hono app entry point
│           ├── db.ts                ← instância postgres (Deno)
│           ├── errors.ts
│           ├── routes/
│           │   ├── auth.ts
│           │   ├── users.ts
│           │   └── services.ts
│           ├── repositories/
│           │   ├── user.repository.ts
│           │   └── service.repository.ts
│           ├── use-cases/
│           │   ├── auth.ts
│           │   ├── user/
│           │   └── service/
│           ├── middleware/
│           │   └── auth.ts          ← Hono JWT middleware
│           └── validation/          ← Schemas Zod
│
├── apps/
│   └── web/                         ← Next.js 15 (App Router)
│       └── src/
│           ├── domain/
│           ├── application/
│           ├── infrastructure/
│           └── presentation/
│               └── app/             ← Next.js App Router
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   ← lint, test, build
│       ├── deploy-api.yml           ← supabase db push + functions deploy
│       └── deploy-web.yml           ← vercel deploy
│
├── turbo.json
└── package.json                     ← root workspaces (apps/web)
```

> **Nota:** `apps/api/` (NestJS) e `packages/domain/` foram removidos.
> A API vive em `supabase/functions/api/`. O domínio compartilhado vive em `supabase/functions/_shared/domain/`.

---

## Onde as Coisas Vivem

**Entidade User:**
- Domínio: `supabase/functions/_shared/domain/entities/user.entity.ts` (fonte da verdade)
- Repositório: `supabase/functions/api/repositories/user.repository.ts`
- Route: `supabase/functions/api/routes/users.ts`
- Frontend HTTP: `apps/web/src/infrastructure/http/user.http-repository.ts`

**Entidade Service:**
- Domínio: `supabase/functions/_shared/domain/entities/service.entity.ts`
- Repositório: `supabase/functions/api/repositories/service.repository.ts`
- Route: `supabase/functions/api/routes/services.ts`
- Frontend HTTP: `apps/web/src/infrastructure/http/service.http-repository.ts`

**`@manager/domain` no frontend:**
- Alias em `apps/web/tsconfig.json` → `../../supabase/functions/_shared/domain/index.ts`
- Alias em `apps/web/vitest.config.ts` → mesmo path (para testes)
- Sem dependência npm — resolvido em tempo de compilação pelo bundler

**Auth:**
- Backend: `supabase/functions/api/middleware/auth.ts` (Hono JWT middleware)
- Routes: `supabase/functions/api/routes/auth.ts`
- Frontend: `apps/web/src/infrastructure/storage/local-storage-token.ts`
- Frontend context: `apps/web/src/presentation/contexts/auth.context.tsx`

**Migrations:**
- `supabase/migrations/` — arquivos `.sql` numerados por timestamp

**CI/CD:**
- `deploy-api.yml` — `supabase db push` → `supabase functions deploy`
- `deploy-web.yml` — `vercel --prod`
