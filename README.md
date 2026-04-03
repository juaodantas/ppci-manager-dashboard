# Manager Dashboard

Boilerplate production-ready para sistemas de gerenciamento interno com autenticação JWT, CRUD de usuários e serviços. Monorepo com Clean Architecture, deploy configurado e testes.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo + npm workspaces |
| API | Supabase Edge Functions (Deno + Hono + postgres) |
| Frontend | Next.js 15 (App Router), TailwindCSS v4, TanStack Query |
| Domínio compartilhado | `supabase/functions/_shared/domain/` — entidades, VOs e exceções (TypeScript) |
| Auth | JWT HS256 via `hono/jwt` + bcryptjs |
| Validação | Zod (API e frontend) |
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

`supabase/functions/_shared/domain/` é a fonte única da verdade para entidades (`User`, `Service`), value objects (`Email`) e exceções. A Edge Function importa diretamente via path relativo (`../_shared/domain/`). O frontend (`apps/web`) resolve o alias `@manager/domain` apontando para o mesmo diretório via `tsconfig.json`.

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
| GET | `/api/services?limit=20&offset=0&status=` | Sim | Lista serviços paginada |
| GET | `/api/services/stats` | Sim | Estatísticas dos serviços |
| POST | `/api/services` | Sim | Cria serviço |
| GET | `/api/services/:id` | Sim | Busca serviço |
| PATCH | `/api/services/:id` | Sim | Atualiza serviço |
| DELETE | `/api/services/:id` | Sim | Remove serviço |

Respostas paginadas retornam `{ data/servicos, total, limit, offset }`.

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
- `apps/web` — 8 testes unitários (LoginUseCase, GetServicesUseCase)
