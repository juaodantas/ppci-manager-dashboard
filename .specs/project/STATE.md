# State

**Last Updated:** 2026-04-03
**Current Phase:** M8 — Relatórios e Fluxo de Caixa (M7 concluído)

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
| 2026-04-03 | Pivot: boilerplate → produto PPCI real | Empresa de engenharia precisa de sistema real. A arquitetura boilerplate é mantida; apenas o domínio de negócio (services JSONB) é substituído por schema relacional completo. |
| 2026-04-03 | Old `services` table será descartada (drop + recreate) | Tabela atual usa JSONB para cliente, pagamentos, cronograma — anti-padrão para dados relacionais. Nova arquitetura usa tabelas separadas com FK reais e integridade referencial. |
| 2026-04-03 | `services` no novo schema = catálogo de tipos (não execuções) | No novo domínio, `services` é tabela de catálogo (ex: "Visita técnica", "PCI extintor"). O que antes era chamado de service (execução) agora é `project`. Renomeação deliberada para clareza. |
| 2026-04-03 | Soft delete via `deleted_at` para customers | Clientes com histórico de projetos/pagamentos não são hard-deleted. Campos `deleted_at` adicionados; queries filtram por `deleted_at IS NULL`. Projetos e pagamentos preservados. |
| 2026-04-03 | financial_entries populadas via trigger no banco | Ao invés de lógica na API para criar entradas financeiras ao pagar, usar trigger PostgreSQL em `payments.paid_date`. Simples, atômico, sem risco de inconsistência. |
| 2026-04-03 | total_amount em quotes calculado via trigger | `quotes.total_amount` é recalculado automaticamente via trigger quando quote_items mudam. Evita inconsistência entre items e total. |
| 2026-04-03 | PDF gerado server-side via biblioteca Deno | Endpoint `GET /quotes/:id/pdf` e `GET /projects/:id/contract-pdf` retornam PDF como blob. Biblioteca a definir (jsPDF port Deno ou html-to-pdf via puppeteer — não rodará em Edge, pode precisar de função separada). |

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
- [ ] Iniciar M8: dashboard financeiro com gráficos de receita vs custos fixos por mês

---

## Deferred Ideas

- RBAC (roles e permissões granulares) — explicitamente fora de M7, pós-v1
- packages/ui com Storybook — pós-v1
- Refresh token rotation — migration `refresh_tokens` existe, `RefreshTokenUseCase` existe no frontend. Endpoint `/auth/refresh` já implementado. Frontend faz refresh automático no bootstrap e desloga se falhar.
- Rate limiting com Hono middleware — pós-M7
- Soft delete para projects e payments — M7 cobre customers; projects podem seguir depois
- OpenTelemetry / observabilidade — pós-v1
- Testes unitários para `_shared/domain/` (Vitest ou deno test) — pós-M8
- Validação: soma de payments não pode exceder projects.total_value — RN não especificada, adiar para M9
- Geração automática de financial_entries para custos fixos mensais — mecanismo de agendamento não definido, adiar para M9

---

## Preferences

- Respostas concisas, sem sumários desnecessários ao final
