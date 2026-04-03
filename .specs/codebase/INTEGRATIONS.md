# External Integrations

**Analyzed:** 2026-03-31
**Updated:** 2026-04-02

## Cloud / Infraestrutura

**Service:** Supabase
**Purpose:** Hosting do backend como Edge Function + banco de dados PostgreSQL
**Implementation:** `supabase/functions/api/index.ts` (Hono app servido via Deno)
**Configuration:** `supabase/config.toml` + env vars no dashboard Supabase
**Deploy:** `supabase functions deploy api --project-ref <ref>`

## Banco de Dados

**Service:** Supabase PostgreSQL
**Purpose:** Persistência de users e services
**Implementation:** `supabase/functions/api/db.ts` — instância `postgres` (postgresjs Deno)
**Configuration:** Env var `DATABASE_URL` (connection string Supabase)
**Authentication:** Connection string com senha do banco

**Operações usadas:**
- Template literals SQL via postgresjs — `sql\`SELECT * FROM users WHERE id = ${id}\``
- Sem ORM — queries SQL diretas nos repositories

## Migrations

**Service:** Supabase CLI
**Purpose:** Versionamento e aplicação de schema no banco
**Implementation:** Arquivos `.sql` em `supabase/migrations/`
**Comandos:**
- `supabase migration new <nome>` — cria novo arquivo de migration
- `supabase db push` — aplica migrations pendentes no banco remoto
- `supabase db reset` — reseta banco local (desenvolvimento)
**CI/CD:** `supabase db push --linked` roda antes do deploy da Edge Function

## Autenticação

**Tipo:** JWT stateless customizado (sem Supabase Auth)
**Purpose:** Proteger endpoints da API
**Implementation:** `supabase/functions/api/middleware/auth.ts` — Hono JWT middleware
**Library:** `hono/jwt` (Deno-compatible)
**Password hashing:** bcryptjs via Deno
**Token expiry:** 7 dias
**Secret:** Env var `JWT_SECRET`

## Frontend → Backend

**HTTP Client:** Axios ^1.14 (instância em `infrastructure/http/`)
**Base URL:** `NEXT_PUBLIC_API_URL` (URL da Edge Function no Supabase)
**Auth:** Bearer token do localStorage em cada request
**Error handling:** Redirect para `/login` em respostas 401

## Frontend Deploy

**Service:** Vercel
**Purpose:** Hosting do app Next.js
**Deploy:** `vercel --prod` via GitHub Actions
**Config:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` como secrets

## CI/CD

**Service:** GitHub Actions
**Workflows:**
- `ci.yml` — lint, test, build (PR e push para main)
- `deploy-api.yml` — `supabase db push` + `supabase functions deploy` (push para main)
- `deploy-web.yml` — deploy Vercel (push para main)

**Secrets necessários no GitHub:**
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Desenvolvimento Local

**Banco local:** `supabase start` sobe PostgreSQL local via Docker
**Edge Function local:** `supabase functions serve api --env-file supabase/.env.local`
**Web local:** `npm run dev --workspace=apps/web`
