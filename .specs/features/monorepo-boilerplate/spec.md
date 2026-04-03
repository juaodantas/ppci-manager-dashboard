# Monorepo Boilerplate Specification

## Problem Statement

O repositório atual possui dois apps separados (`manager-api` e `manager-front`) sem tooling de monorepo, sem Clean Architecture, sem autenticação e com banco de dados AWS DynamoDB acoplado ao Serverless Framework. O objetivo é refatorar para um boilerplate production-ready que sirva de base reutilizável, com arquitetura clara, autenticação JWT e infraestrutura de deploy simples.

## Goals

- [x] Monorepo Turborepo funcional com build/dev/lint/test unificados
- [x] Clean Architecture implementada em api e web — domínio testável e independente de framework
- [x] CRUD completo de Users e Services com autenticação JWT end-to-end
- [x] Supabase PostgreSQL como banco, com migrations gerenciadas pela Supabase CLI (SQL puro)
- [x] API deployada como Supabase Edge Function (Hono + Deno)
- [ ] Deploy automatizado via GitHub Actions → Supabase (api) + Vercel (web) ← pendente configuração de secrets

## Out of Scope

| Feature                    | Reason                                           |
|----------------------------|--------------------------------------------------|
| RBAC / roles granulares    | Complexidade extra, pós-v1                       |
| packages/ui (design system)| Opcional, não necessário para o boilerplate core |
| Upload de arquivos         | Requer infra adicional (S3/Cloudflare R2)        |
| Refresh token rotation     | Pós-v1 — JWT simples é suficiente               |
| Multi-tenancy              | Fora do escopo do boilerplate                    |
| Notificações               | Fora do core                                     |

---

## User Stories

### P1: Estrutura Turborepo ⭐ MVP

**User Story:** Como desenvolvedor, quero um monorepo Turborepo configurado com `apps/api`, `apps/web` e `packages/`, para que eu possa gerenciar os apps com um único toolset.

**Why P1:** Fundação de tudo. Sem isso nenhum outro milestone funciona.

**Acceptance Criteria:**

1. WHEN executo `npm run dev` na raiz THEN o sistema SHALL iniciar api e web simultaneamente
2. WHEN executo `npm run build` na raiz THEN o sistema SHALL buildar api e web com cache Turborepo
3. WHEN executo `npm run lint` na raiz THEN o sistema SHALL rodar linting em todos os workspaces
4. WHEN importo de `@manager/domain` em `apps/web` THEN o sistema SHALL resolver os tipos via tsconfig alias apontando para `supabase/functions/_shared/domain/`
5. WHEN a Edge Function importa de `../_shared/domain/` THEN o sistema SHALL encontrar os arquivos sem symlinks

**Independent Test:** `npm run build` na raiz sem erros; `turbo build --dry` mostra pipeline correta.

---

### P1: Auth Backend — Login e Registro ⭐ MVP

**User Story:** Como usuário, quero fazer login e registro via API, para que eu possa acessar os recursos protegidos.

**Why P1:** Sem auth o CRUD de users/services não tem valor como boilerplate seguro.

**Acceptance Criteria:**

1. WHEN envio POST /auth/register com email e senha válidos THEN sistema SHALL criar user e retornar token JWT
2. WHEN envio POST /auth/login com credenciais válidas THEN sistema SHALL retornar token JWT
3. WHEN envio POST /auth/login com credenciais inválidas THEN sistema SHALL retornar 401
4. WHEN acesso endpoint protegido sem token THEN sistema SHALL retornar 401
5. WHEN acesso endpoint protegido com token válido THEN sistema SHALL processar a request

**Independent Test:** `curl POST /auth/login` retorna `{ access_token: "..." }`; request para `/users` sem header retorna 401.

---

### P1: CRUD Users (Backend) ⭐ MVP

**User Story:** Como admin, quero gerenciar usuários via API, para que eu possa criar, listar, atualizar e deletar contas.

**Why P1:** Entidade central do boilerplate. Auth depende de users existirem.

**Acceptance Criteria:**

1. WHEN envio POST /users com dados válidos THEN sistema SHALL criar user e retornar 201 com dados (sem senha)
2. WHEN envio GET /users THEN sistema SHALL retornar lista de users (sem senhas)
3. WHEN envio GET /users/:id com ID existente THEN sistema SHALL retornar o user
4. WHEN envio GET /users/:id com ID inexistente THEN sistema SHALL retornar 404
5. WHEN envio PATCH /users/:id com dados parciais THEN sistema SHALL atualizar e retornar user
6. WHEN envio DELETE /users/:id THEN sistema SHALL deletar e retornar 204
7. WHEN tento criar user com email duplicado THEN sistema SHALL retornar 409

**Independent Test:** CRUD completo via Swagger em `/api-docs`.

---

### P1: CRUD Services (Backend — Supabase PostgreSQL) ⭐ MVP

**User Story:** Como usuário autenticado, quero gerenciar serviços via API com Supabase PostgreSQL, para que os dados sejam persistidos relacionalmente.

**Why P1:** Migração do DynamoDB para PostgreSQL é core da refatoração de infra.

**Acceptance Criteria:**

1. WHEN executo `supabase db push` THEN sistema SHALL criar tabelas `users` e `services` no Supabase PostgreSQL
2. WHEN acesso qualquer endpoint /services sem token THEN sistema SHALL retornar 401
3. WHEN envio POST/GET/PATCH/DELETE /services com token válido THEN sistema SHALL funcionar igual ao comportamento anterior
4. WHEN executo seed manual (SQL ou script) THEN sistema SHALL popular o banco com dados de exemplo

**Independent Test:** `supabase db push` sem erros; CRUD via curl/httpie funciona com Bearer token.

---

### P1: Auth Frontend — Login/Registro ⭐ MVP

**User Story:** Como usuário, quero fazer login e registro pela interface web, para que eu possa acessar o dashboard.

**Why P1:** Ponto de entrada do app. Sem isso o frontend não tem utilidade.

**Acceptance Criteria:**

1. WHEN acesso `/login` sem estar autenticado THEN sistema SHALL exibir formulário de login
2. WHEN submeto login com credenciais válidas THEN sistema SHALL salvar token e redirecionar para dashboard
3. WHEN submeto login com credenciais inválidas THEN sistema SHALL exibir mensagem de erro
4. WHEN estou autenticado e acesso `/login` THEN sistema SHALL redirecionar para dashboard
5. WHEN clico em logout THEN sistema SHALL remover token e redirecionar para `/login`
6. WHEN token expira THEN sistema SHALL redirecionar para `/login`

**Independent Test:** Login com usuário do seed → redireciona para dashboard; acesso direto a `/services` sem login → redireciona para `/login`.

---

### P1: CRUD Services (Frontend) ⭐ MVP

**User Story:** Como usuário autenticado, quero gerenciar serviços pela interface, para que eu possa criar, visualizar, editar e deletar serviços.

**Why P1:** Funcionalidade existente que deve ser preservada após a migração.

**Acceptance Criteria:**

1. WHEN acesso `/services` autenticado THEN sistema SHALL listar todos os serviços
2. WHEN clico em "Novo Serviço" THEN sistema SHALL exibir formulário de criação
3. WHEN submeto formulário válido THEN sistema SHALL criar serviço e atualizar lista
4. WHEN clico em editar THEN sistema SHALL exibir formulário preenchido
5. WHEN submeto edição THEN sistema SHALL atualizar e refletir na lista
6. WHEN clico em deletar e confirmo THEN sistema SHALL remover da lista

**Independent Test:** CRUD completo de serviços no browser com chamadas reais à API.

---

### P2: CRUD Users (Frontend)

**User Story:** Como admin, quero gerenciar usuários pela interface, para que eu possa administrar contas sem precisar de ferramentas externas.

**Why P2:** Importante para o boilerplate mas não bloqueia o MVP da autenticação.

**Acceptance Criteria:**

1. WHEN acesso `/users` THEN sistema SHALL listar usuários
2. WHEN clico em criar/editar/deletar THEN sistema SHALL realizar a operação via API
3. WHEN operação é bem-sucedida THEN sistema SHALL atualizar a lista e exibir feedback

**Independent Test:** CRUD completo de usuários no browser.

---

### P2: CI/CD GitHub Actions

**User Story:** Como desenvolvedor, quero pipelines automáticas que façam deploy no Supabase e Vercel ao fazer push para main, para que o processo de deploy seja confiável e sem intervenção manual.

**Why P2:** Essencial para um boilerplate production-ready, mas não bloqueia o desenvolvimento local.

**Acceptance Criteria:**

1. WHEN abro um PR THEN sistema SHALL rodar CI (lint, test, build) e bloquear merge se falhar
2. WHEN faço push para main com mudanças em `supabase/**` THEN sistema SHALL rodar `supabase db push` antes do deploy
3. WHEN faço push para main THEN sistema SHALL fazer deploy da api via `supabase functions deploy`
4. WHEN faço push para main THEN sistema SHALL fazer deploy do web para Vercel

**Independent Test:** Push para main → migrations aplicadas + edge function deployada no dashboard Supabase + web no Vercel.

---

## Edge Cases

- WHEN criar user com email inválido THEN sistema SHALL retornar 400 com mensagem descritiva
- WHEN migration falha THEN sistema SHALL fazer rollback e não subir o serviço
- WHEN API está indisponível THEN frontend SHALL exibir estado de erro (não tela branca)
- WHEN token JWT é malformado THEN sistema SHALL retornar 401 (não 500)
- WHEN envio campos extras na request THEN sistema SHALL ignorar (whitelist via ValidationPipe)

---

## Requirement Traceability

| Requirement ID | Story                            | Phase  | Status  |
|----------------|----------------------------------|--------|---------|
| MONO-01        | P1: Turborepo Setup              | Design | Pending |
| MONO-02        | P1: _shared/domain               | Design | Done    |
| MONO-03        | P1: packages/tsconfig            | Design | Done    |
| AUTH-01        | P1: Auth Backend — Register      | Design | Pending |
| AUTH-02        | P1: Auth Backend — Login         | Design | Pending |
| AUTH-03        | P1: Auth Backend — Guard         | Design | Pending |
| AUTH-04        | P1: Auth Frontend — Login page   | Design | Pending |
| AUTH-05        | P1: Auth Frontend — Route guard  | Design | Pending |
| USER-01        | P1: CRUD Users Backend           | Design | Pending |
| USER-02        | P2: CRUD Users Frontend          | Design | Pending |
| SVC-01         | P1: CRUD Services Backend (PG)   | Design | Pending |
| SVC-02         | P1: CRUD Services Frontend       | Design | Pending |
| INFRA-01       | P2: GitHub Actions CI            | Design | Pending |
| INFRA-02       | P2: GitHub Actions CD — Supabase | Design | Pending |
| INFRA-03       | P2: GitHub Actions CD — Vercel   | Design | Pending |

---

## Success Criteria

- [ ] `supabase functions serve api` + `npm run dev --workspace=apps/web` inicia api e web localmente
- [ ] Login com usuário seed funciona end-to-end no browser
- [ ] CRUD de Services e Users funciona autenticado no browser
- [ ] `npm run build` na raiz (packages + web) completa sem erros
- [ ] Push para main dispara deploy automático (Supabase Edge Function + Vercel)
