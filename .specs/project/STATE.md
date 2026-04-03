# State

**Last Updated:** 2026-04-02
**Current Phase:** ✅ Boilerplate Completo — API, web e domínio compartilhado operacionais

---

## Decisions

| Date       | Decision                                          | Rationale                                                                 |
|------------|---------------------------------------------------|---------------------------------------------------------------------------|
| 2026-03-31 | Usar Turborepo para monorepo                      | Tooling padrão para monorepos TypeScript, cache de build, pipelines claras |
| 2026-03-31 | Migrar DynamoDB → PostgreSQL                      | Simplifica queries relacionais, elimina overhead AWS                      |
| 2026-03-31 | Migrar Vite/React → Next.js (App Router)          | SSR, App Router, convenção de roteamento por pasta, ecossistema robusto    |
| 2026-03-31 | Clean Architecture em ambos os apps               | Domínio isolado, testável, fácil de trocar infra                          |
| 2026-03-31 | packages/ui fora do escopo v1                     | Complexidade desnecessária para boilerplate inicial                        |
| 2026-03-31 | JWT stateless (sem refresh token rotation em v1)  | Simplicidade no boilerplate; rotation pode ser adicionada depois           |
| 2026-03-31 | packages/domain exporta classes com lógica pura   | Domínio sem dependências externas — classes com validação/transformação são bem-vindas |
| 2026-04-01 | Migrar NestJS → Hono                              | NestJS é Node.js only; Supabase Edge Functions rodam em Deno. Hono tem DX idêntico ao Fastify e é edge-native (Deno, Cloudflare, Vercel Edge) |
| 2026-04-01 | Migrar Railway → Supabase Edge Functions          | Consolidar infra: banco + API no mesmo ecossistema Supabase. Sem cold start de edge, sem custo fixo de servidor |
| 2026-04-01 | Migrar TypeORM → SQL direto (postgresjs Deno)     | TypeORM não é compatível com Deno. SQL direto é mais simples e sem magia para uma edge function |
| 2026-04-01 | Migrar TypeORM migrations → Supabase CLI          | Já usando Supabase como banco, faz sentido usar o ecossistema deles. Migrations como SQL puro, versionadas pela CLI |
| 2026-04-01 | Manter JWT customizado (não usar Supabase Auth)   | Menor acoplamento ao Supabase, lógica de auth controlada, sem overhead de Auth externo para um boilerplate |
| 2026-04-01 | packages/domain copiado em functions/api/domain   | Deno não acessa workspace npm. Em v1, copiar tipos manualmente. Futuramente publicar como pacote JSR/npm |
| 2026-04-02 | Domain movido para `supabase/functions/_shared/domain/` | Symlink `api/domain → packages/domain/src` quebrava no Edge Runtime (sandbox não segue symlinks externos). Solução: `_shared/domain/` como fonte da verdade; web resolve via tsconfig path alias. `packages/domain/` removido. |

---

## Blockers

_Nenhum no momento._

---

## Lessons Learned

| Date       | Lesson                                                                                      |
|------------|---------------------------------------------------------------------------------------------|
| 2026-03-31 | main.ts acoplado ao Lambda impediu desenvolvimento local fácil — separar adapters desde o início |
| 2026-04-01 | Fastify não roda em Deno (Node.js only) — para Supabase Edge Functions, usar Hono que é edge-native |
| 2026-04-02 | Supabase Edge Runtime sandboxeia a função — symlinks que apontam para fora do diretório da função falham em runtime, mesmo que o arquivo exista no disco |

---

## Todos

- [ ] Criar projeto no Supabase e obter `project_ref`
- [ ] Configurar secrets no GitHub Actions: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`
- [ ] Configurar secrets Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

## Deferred Ideas

- RBAC (roles e permissões granulares) — pós-v1
- packages/ui com Storybook — pós-v1
- Refresh token rotation — implementado parcialmente: migration `refresh_tokens` existe, `RefreshTokenUseCase` existe no frontend. Falta integração no backend (endpoint `/auth/refresh`).
- Rate limiting com Hono middleware — pós-v1
- Soft delete para usuários e serviços — pós-v1
- OpenTelemetry / observabilidade — pós-v1
- Testes unitários para `_shared/domain/` (Vitest ou deno test) — pós-v1
- Testes unitários com `deno test` na edge function — pós-v1

---

## Preferences

- Respostas concisas, sem sumários desnecessários ao final
