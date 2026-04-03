# Tech Stack

**Analyzed:** 2026-03-31
**Updated:** 2026-04-02

## Core

- Language: TypeScript ~5.9 (frontend) / TypeScript via Deno (backend)
- Package manager: npm (frontend/packages), Deno (backend edge function)
- Runtime: Node.js (web), Deno (api edge function)

## Frontend (apps/web — Next.js)

- Framework: Next.js 15 (App Router)
- Styling: TailwindCSS v4
- State Management: @tanstack/react-query ^5.96 (server state)
- HTTP Client: Axios ^1.14
- Icons: lucide-react
- Validation: Zod ^3.23
- Build: Next.js + tsc

## Backend (supabase/functions/api — Hono + Deno)

- Framework: **Hono** (edge-native, Deno-compatible, Fastify-like DX)
- Runtime: **Deno** (Supabase Edge Functions)
- Database: **Supabase PostgreSQL** (via `postgresjs` Deno module)
- ORM: **Nenhum** — SQL direto via `postgres` (sem TypeORM)
- Auth: JWT custom (jose/djwt — Deno-compatible), bcryptjs via Deno
- Migrations: **Supabase CLI** — arquivos `.sql` em `supabase/migrations/`
- Deploy: **Supabase Edge Functions** (`supabase functions deploy`)

## Migrations

- Ferramenta: Supabase CLI (`supabase migration new`, `supabase db push`)
- Formato: SQL puro em `supabase/migrations/<timestamp>_<nome>.sql`
- Histórico: controlado pela tabela `supabase_migrations` no próprio banco

## Testing

- Unit: Vitest ^2 (apps/web)
- E2E: Frontend — sem framework configurado atualmente
- Backend: sem testes automatizados na v1 (edge functions)

## External Services

- Cloud: **Supabase** (Edge Functions + PostgreSQL)
- Frontend Deploy: **Vercel**
- CI/CD: GitHub Actions

## Development Tools

- Linter: ESLint ^9 (flat config) — apps/web e packages
- Formatter: Prettier ^3
- Supabase CLI: gerenciamento de migrations e deploy de functions
