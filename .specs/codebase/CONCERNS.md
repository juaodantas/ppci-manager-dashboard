# Codebase Concerns

**Analyzed:** 2026-03-31
**Updated:** 2026-04-02

---

## 🟡 MODERADO

### C12 — Sem desenvolvimento local unificado

**Evidência:** `apps/web` roda via `npm run dev`, mas a Edge Function requer `supabase functions serve` + `supabase start` (Docker). Não há um único comando para subir tudo.
**Impacto:** Fricção no setup local — dois terminais e Docker obrigatório para desenvolvimento completo.
**Fix:** Adicionar script `dev:all` no `package.json` raiz orquestrando `supabase start`, `supabase functions serve` e `turbo dev --filter=apps/web` via `concurrently`.

### C13 — Edge Functions sem testes automatizados

**Evidência:** Deno tem suporte nativo a testes (`deno test`), mas nenhum teste foi configurado para a edge function.
**Impacto:** Regressões não detectadas automaticamente no backend.
**Fix (pós-v1):** Adicionar testes unitários com `deno test` para repositories e use cases. Integrar no CI.

---

## 🟢 BAIXO

### C14 — Sem tipagem compartilhada entre edge function e web para payloads HTTP

**Evidência:** Os tipos de request/response da API (DTOs) são definidos independentemente no Hono e no frontend Axios.
**Impacto:** Divergência silenciosa de contratos HTTP.
**Fix (pós-v1):** Publicar tipos de contrato da API no pacote `@manager/domain` ou criar `packages/api-types` dedicado.

---

## ✅ RESOLVIDOS

| ID  | Concern original                              | Resolução                                          |
|-----|-----------------------------------------------|----------------------------------------------------|
| C01 | Ausência total de autenticação no backend     | JWT customizado via Hono middleware                |
| C02 | main.ts acoplado ao Lambda                    | Edge Function com entry point Deno/Hono padrão     |
| C03 | DynamoDB com Scan para todas as queries       | Migrado para PostgreSQL com SQL direto             |
| C04 | Frontend sem arquitetura de camadas           | Clean Architecture implementada no apps/web        |
| C05 | Domínio duplicado entre frontend e backend    | `_shared/domain/` como fonte única; web resolve via tsconfig alias |
| C11 | packages/domain inacessível no Deno Edge Function | Removido symlink quebrado; domain movido para `supabase/functions/_shared/domain/` |
| C06 | Ausência de módulo de usuários                | CRUD de Users implementado                         |
| C07 | Vite/React no frontend                        | Migrado para Next.js 15 App Router                 |
| C08 | Sem configuração de CI/CD                     | GitHub Actions configurado                         |
| C09 | Sem testes no frontend                        | Vitest configurado em apps/web — 8 testes unitários (LoginUseCase, GetServicesUseCase) |
| C10 | DTOs agrupados num arquivo único              | DTOs separados por entidade                        |
