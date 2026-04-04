# PPCI Manager Dashboard

Sistema de gestão interna para empresa de engenharia especializada em regularização de imóveis (PPCI/AVCB). Controla o ciclo completo — do orçamento ao recebimento — e o fluxo de caixa da empresa. Monorepo com Clean Architecture, deploy configurado e testes.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo + npm workspaces |
| API | Supabase Edge Functions (Deno + Hono + postgres) |
| Frontend | Next.js 15 (App Router), TailwindCSS v4, TanStack Query |
| Domínio compartilhado | `supabase/functions/_shared/domain/` — entidades, VOs e exceções (TypeScript) |
| Auth | JWT HS256 via `hono/jwt` + bcryptjs |
| Validação | Zod (API e frontend) |
| PDF | `@react-pdf/renderer` (frontend-side) |
| Testes | Vitest |
| Deploy API | Supabase |
| Deploy Web | Vercel |
| CI/CD | GitHub Actions |

## Estrutura

```
manager-dashboard/
├── apps/
│   └── web/                  # Next.js 15 — App Router + Clean Architecture
│       └── src/
│           ├── app/          # Rotas (App Router, grupos auth/dashboard)
│           ├── presentation/ # Componentes, hooks, contextos
│           ├── application/  # Use-cases, ports, schemas de validação
│           ├── domain/       # Entidades, repositórios (interfaces)
│           └── infrastructure/ # HTTP, storage, DI container
├── packages/
│   └── tsconfig/             # Configurações TypeScript base
└── supabase/
    ├── functions/
    │   ├── _shared/
    │   │   └── domain/       # Fonte da verdade — entidades, VOs e exceções
    │   └── api/              # Edge Function — Hono + Clean Architecture
    │       ├── repositories/ # SQL via postgres lib, retorna entidades do domain
    │       ├── use-cases/    # Lógica de negócio
    │       ├── routes/       # Hono routes com validação Zod
    │       ├── middleware/   # JWT auth
    │       └── validation/   # Schemas Zod
    └── migrations/           # SQL migrations
```

### Domain compartilhado

`supabase/functions/_shared/domain/` é a fonte única da verdade para entidades (`User`, `Customer`, `Quote`, `Project`, `Payment`, `ServiceCatalogItem`, `FixedCost`, `FinancialEntry`), value objects (`Email`) e exceções. A Edge Function importa diretamente via path relativo (`../_shared/domain/`). O frontend (`apps/web`) resolve o alias `@manager/domain` apontando para o mesmo diretório via `tsconfig.json`.

## Rodando localmente

**Pré-requisitos:** Node 20+, Supabase CLI, Deno

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp supabase/.env.local.example supabase/.env.local
# Preencher SUPABASE_DB_URL e JWT_SECRET

# 3. Subir Supabase local
supabase start

# 4. Rodar migrations
npm run db:push

# 5. Servir a Edge Function localmente
npm run api:serve

# 6. Iniciar o frontend (em outro terminal)
npm run dev
```

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| API (local) | http://localhost:54321/functions/v1/api |
| Supabase Studio | http://localhost:54323 |

## Variáveis de ambiente

### `supabase/.env.local`

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `SUPABASE_DB_URL` | Connection string PostgreSQL | Sim |
| `JWT_SECRET` | Segredo para assinar tokens JWT | Sim |
| `CORS_ORIGIN` | Origem permitida no CORS (padrão: `*`) | Não |

### `apps/web/.env.local`

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL base da Edge Function |

> **Atenção:** `JWT_SECRET` não tem fallback. A função falhará no startup se não estiver definida.

## Scripts disponíveis

```bash
# Desenvolvimento e build
npm run dev          # Inicia o frontend em modo dev
npm run build        # Build de produção de todos os packages
npm run lint         # Lint em todos os workspaces
npm run test         # Testes em todos os workspaces
npm run format       # Formata código com Prettier

# API (Supabase Edge Functions)
npm run api:serve    # Serve a função localmente com hot reload
npm run api:deploy   # Faz deploy da função para o Supabase

# Banco de dados
npm run db:push      # Aplica migrations no banco
npm run db:reset     # Reseta o banco local (supabase local)
```

## Endpoints da API

Todos os endpoints (exceto auth) requerem header `Authorization: Bearer <token>`.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/health` | Não | Health check |
| POST | `/api/auth/register` | Não | Cadastro + retorna JWT |
| POST | `/api/auth/login` | Não | Login + retorna JWT |
| GET | `/api/users?limit=20&offset=0` | Sim | Lista usuários paginada |
| POST | `/api/users` | Sim | Cria usuário |
| GET | `/api/users/:id` | Sim | Busca usuário |
| PATCH | `/api/users/:id` | Sim | Atualiza usuário |
| DELETE | `/api/users/:id` | Sim | Remove usuário |
| GET | `/api/customers?limit=20&offset=0` | Sim | Lista clientes (exclui deleted) |
| POST | `/api/customers` | Sim | Cria cliente |
| GET | `/api/customers/:id` | Sim | Detalhe com orçamentos e projetos |
| PUT | `/api/customers/:id` | Sim | Atualiza cliente |
| DELETE | `/api/customers/:id` | Sim | Soft delete (seta deleted_at) |
| GET | `/api/service-catalog` | Sim | Lista serviços agrupados por categoria |
| GET | `/api/service-catalog/categories` | Sim | Lista categorias |
| POST | `/api/service-catalog` | Sim | Cria serviço no catálogo |
| PUT | `/api/service-catalog/:id` | Sim | Atualiza serviço |
| DELETE | `/api/service-catalog/:id` | Sim | Inativa serviço (is_active = false) |
| POST | `/api/service-catalog/:id/prices` | Sim | Adiciona novo preço (fecha anterior) |
| GET | `/api/quotes?status=&customer_id=` | Sim | Lista orçamentos com filtros |
| POST | `/api/quotes` | Sim | Cria orçamento com itens |
| GET | `/api/quotes/:id` | Sim | Detalhe com itens |
| PUT | `/api/quotes/:id` | Sim | Atualiza (apenas draft/sent) |
| DELETE | `/api/quotes/:id` | Sim | Deleta (apenas draft) |
| POST | `/api/quotes/:id/approve` | Sim | Aprova e cria projeto; retorna `{ project_id }` |
| GET | `/api/projects?status=&customer_id=` | Sim | Lista projetos com filtros |
| POST | `/api/projects` | Sim | Cria projeto diretamente (sem quote) |
| GET | `/api/projects/:id` | Sim | Detalhe com serviços e pagamentos |
| PUT | `/api/projects/:id` | Sim | Atualiza (bloqueado se finished) |
| POST | `/api/projects/:id/services` | Sim | Adiciona serviço ao projeto |
| PUT | `/api/project-services/:id` | Sim | Atualiza item de serviço |
| DELETE | `/api/project-services/:id` | Sim | Remove item de serviço |
| GET | `/api/payments?project_id=&status=` | Sim | Lista pagamentos |
| POST | `/api/payments` | Sim | Cria pagamento |
| PUT | `/api/payments/:id/pay` | Sim | Marca como pago; trigger cria financial_entry |
| GET | `/api/fixed-costs` | Sim | Lista custos fixos ativos |
| POST | `/api/fixed-costs` | Sim | Cria custo fixo |
| PUT | `/api/fixed-costs/:id` | Sim | Atualiza custo fixo |
| DELETE | `/api/fixed-costs/:id` | Sim | Remove custo fixo |
| GET | `/api/financial/entries?type=&date_from=&date_to=` | Sim | Lista lançamentos financeiros |
| GET | `/api/financial/report?date_from=&date_to=` | Sim | Relatório: receitas, custos, saldo |

Respostas paginadas retornam `{ data, total, limit, offset }`.

## Deploy

### API (Supabase)

Push para `main` com mudanças em `supabase/**` dispara `.github/workflows/deploy-api.yml`:

1. Aplica migrations (`supabase db push`)
2. Faz deploy da Edge Function (`supabase functions deploy api`)

Secrets necessários: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`

### Web (Vercel)

Push para `main` com mudanças em `apps/web/**` ou `supabase/functions/_shared/**` dispara `.github/workflows/deploy-web.yml`.

Secrets necessários: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Testes

```bash
npm run test              # Roda todos os testes
npm run test -w @manager/web      # Apenas testes do web
```

Cobertura atual:
- `apps/web` — testes unitários (LoginUseCase)
