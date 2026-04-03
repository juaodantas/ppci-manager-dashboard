# Roadmap

**Current Milestone:** M6 — Deploy & Produção
**Status:** Pronto para deploy

---

## M1 — Monorepo Foundation ✅

**Goal:** Repositório reestruturado como Turborepo com apps e packages configurados.
**Status:** Concluído

---

## M2 — Backend Clean Architecture + PostgreSQL ✅ (parcial)

**Goal:** API com Clean Architecture completa, PostgreSQL, rodando com NestJS/Railway.
**Status:** Implementado — sendo substituído pela M5

---

## M3 — Frontend Clean Architecture (Next.js) ✅

**Goal:** App Next.js com Clean Architecture, conectado ao backend, com auth e CRUD completo.
**Status:** Concluído

### Entregues

- Domain layer: entidades, repositórios (interfaces), value objects
- Application layer: use cases de auth (login, logout, register, refresh-token), services (get), validation schemas (Zod)
- Infrastructure layer: HTTP repositories (Axios), LocalStorage token adapter, DI container
- Presentation layer: páginas login, dashboard, users, services; hooks; auth context
- Testes: 8 testes unitários com Vitest (LoginUseCase, GetServicesUseCase)

---

## M4 — CI/CD & Deploy ✅

**Goal:** Pipeline automatizado com deploy contínuo em Supabase (api) e Vercel (web).
**Status:** Concluído

### Entregues

- `ci.yml` — lint, test, build (PR e push para main)
- `deploy-api.yml` — `supabase db push` + `supabase functions deploy api` no push para main
- `deploy-web.yml` — deploy Vercel no push para main

---

## M5 — API Migration: NestJS → Hono + Supabase ✅

**Goal:** Substituir a API NestJS/Railway por uma Supabase Edge Function com Hono + SQL direto.
**Status:** Concluído

### Entregues

- Supabase CLI + migrations SQL (`supabase/migrations/`)
- Edge Function Hono com routes `/auth`, `/users`, `/services`
- JWT middleware, repositórios SQL direto (postgresjs Deno)
- CI/CD reescrito: `deploy-api.yml` com `supabase db push` + `supabase functions deploy`
- `apps/api/` (NestJS) e `packages/domain/` removidos do monorepo
- Domain movido para `supabase/functions/_shared/domain/` — fonte única da verdade acessível pela edge function e pelo frontend via tsconfig alias

---

## M6 — Deploy & Produção ← CURRENT

**Goal:** Configurar projeto Supabase + secrets e fazer primeiro deploy em produção.
**Target:** API e web acessíveis em URLs públicas com deploy automático no push para main.

### Checklist

- [ ] Criar projeto no Supabase e obter `project_ref`
- [ ] Configurar secrets no GitHub: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`
- [ ] Configurar secrets Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Definir `NEXT_PUBLIC_API_URL` no projeto Vercel
- [ ] Validar deploy end-to-end

---

## Future Considerations

- packages/ui — design system compartilhado com Storybook
- RBAC — sistema de roles e permissões
- Refresh token rotation
- Rate limiting na API (Hono middleware)
- Observabilidade (OpenTelemetry)
- Testes unitários para `_shared/domain/` (Vitest ou deno test)
