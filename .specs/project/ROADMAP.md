# Roadmap

**Current Milestone:** M8 — Relatórios e Fluxo de Caixa
**Status:** M7 concluído — substituição do domínio genérico pelo domínio PPCI

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

## M6 — Deploy & Produção ✅ (parcial)

**Goal:** Configurar projeto Supabase + secrets e fazer primeiro deploy em produção.
**Status:** Infraestrutura CI/CD pronta; secrets de produção pendentes.

### Checklist

- [ ] Criar projeto no Supabase e obter `project_ref`
- [ ] Configurar secrets no GitHub: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`
- [ ] Configurar secrets Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Definir `NEXT_PUBLIC_API_URL` no projeto Vercel
- [ ] Validar deploy end-to-end

---

## M7 — Refactoring Core (PPCI Domain) ✅

**Goal:** Substituir o domínio genérico (boilerplate) pelo domínio real da empresa de engenharia PPCI. Isso inclui novo schema de banco, novas entidades, novos endpoints e novas páginas.

**Spec:** `.specs/features/refactoring-core/spec.md`

### O que foi preservado

- users + refresh_tokens (auth intacta)
- Hono router pattern + auth middleware
- Clean Architecture (routes → use-cases → repositories)
- DI container pattern no frontend
- CI/CD pipelines

### O que foi substituído

- Tabela `services` (JSONB) → schema relacional completo (10 tabelas novas)
- `_shared/domain/entities/service.entity.ts` → múltiplas entidades
- Rotas `/services` → `/customers`, `/quotes`, `/projects`, `/payments`, `/service-catalog`, `/fixed-costs`, `/financial`
- Páginas frontend de serviços → todas as novas páginas do domínio PPCI

### Entregas

- [x] Migration: drop old services schema + create new relational schema
- [x] Migration seed: categorias e tipos de serviço PPCI
- [x] Backend: repositories + use-cases + routes para todas as entidades
- [x] Backend: endpoint de aprovação de orçamento (POST /quotes/:id/approve)
- [x] Frontend: páginas Clientes, Orçamentos, Projetos, Financeiro, Catálogo
- [x] Frontend: atualização do DI container e navegação
- [x] Frontend: exportação PDF de orçamentos e contratos (@react-pdf/renderer)

---

## M8 — Relatórios e Fluxo de Caixa ← CURRENT

**Goal:** Dashboard financeiro completo com filtros por período, cliente e tipo de serviço.

- Gráficos de receita vs custos fixos por mês
- Relatório de inadimplência (pagamentos overdue)
- Exportação de relatórios em PDF/CSV

---

## Future Considerations

- RBAC — sistema de roles e permissões (pós-M7)
- packages/ui — design system compartilhado com Storybook
- Refresh token rotation (migration já existe, falta endpoint /auth/refresh)
- Rate limiting na API (Hono middleware)
- Observabilidade (OpenTelemetry)
- Soft delete para clientes e projetos (deleted_at — fundação já no design M7)
