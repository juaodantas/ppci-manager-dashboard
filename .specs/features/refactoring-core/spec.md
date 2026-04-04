# Spec: Refactoring Core — Domínio PPCI

**ID:** F-REFCORE
**Status:** Planejado
**Milestone:** M7

## Contexto

O repositório foi construído como boilerplate genérico (auth + CRUD de serviços com JSONB). Agora será transformado em produto real para empresa de engenharia PPCI. A infraestrutura (Turborepo, Hono, Supabase, JWT auth, CI/CD) é mantida integralmente. O domínio de negócio é substituído.

---

## Requisitos Funcionais

| ID   | Requisito                                                                                 | Origem  |
|------|-------------------------------------------------------------------------------------------|---------|
| RF01 | O sistema deve permitir o cadastro, edição e listagem de clientes                        | RF01/RF02/RF06 |
| RF02 | O sistema deve associar um cliente a um ou mais projetos e orçamentos                    | RF03    |
| RF03 | O sistema deve permitir soft delete de clientes (preservando histórico)                  | Risco identificado |
| RF04 | O sistema deve manter catálogo de tipos de serviço organizados por categoria             | RF01/RF08 |
| RF05 | O sistema deve registrar histórico de preços por tipo de serviço (service_price)         | RF16    |
| RF06 | O sistema deve permitir criação de orçamentos agrupando itens de serviço                 | RF18    |
| RF07 | O sistema deve calcular o total do orçamento automaticamente a partir dos itens          | RF16    |
| RF08 | O sistema deve permitir aprovação de orçamento, gerando projeto automaticamente           | RF19    |
| RF09 | O sistema deve exportar orçamentos em PDF                                                 | RF17    |
| RF10 | O sistema deve permitir criação de projetos diretamente (sem orçamento)                  | Fluxo 2 |
| RF11 | O sistema deve permitir adição/edição/remoção de serviços em um projeto                  | RF01/RF08 |
| RF12 | O sistema deve registrar datas de início e fim dos projetos                               | RF04    |
| RF13 | O sistema deve permitir consulta de projetos por status                                   | RF11    |
| RF14 | O sistema deve disponibilizar contrato em PDF por projeto                                 | RF20    |
| RF15 | O sistema deve registrar pagamentos vinculados a projetos                                 | RF09/RF10 |
| RF16 | O sistema deve permitir marcar pagamentos como pagos (com data de pagamento)              | RF10    |
| RF17 | O sistema deve cadastrar e editar custos fixos mensais                                    | RF14/RF07 |
| RF18 | O sistema deve gerar relatório financeiro: receitas vs custos por período                 | RF15    |
| RF19 | O sistema deve manter log de entradas financeiras (income/expense)                        | RF15    |

---

## Regras de Negócio

| ID   | Regra                                                                                        |
|------|----------------------------------------------------------------------------------------------|
| RN01 | Um projeto com status `finished` não pode ser editado                                       |
| RN02 | Um projeto não pode ser marcado como `finished` se houver pagamentos com status `pending`    |
| RN03 | Um cliente deve ter ao menos um meio de contato válido (email ou phone)                      |
| RN04 | Ao aprovar um orçamento: status → `approved`, projeto criado com `quote_id`, itens copiados  |
| RN05 | `quotes.total_amount` é sempre derivado dos itens (calculado via trigger no banco)           |
| RN06 | Pagamentos marcados como `paid` geram automaticamente uma `financial_entry` do tipo `income`  |
| RN07 | Clientes não são hard-deleted; recebem `deleted_at` e somem das listagens ativas             |

---

## Requisitos Não Funcionais (herdados e ajustados)

| ID    | Requisito                                                                              |
|-------|----------------------------------------------------------------------------------------|
| RNF01 | Sistema responsivo, acessível via navegadores modernos                                 |
| RNF02 | Tempo de resposta < 2s para operações CRUD                                             |
| RNF03 | Dados armazenados com segurança; todas as rotas (exceto auth) requerem JWT             |
| RNF04 | Backup gerenciado pelo Supabase (plano pago = backups diários)                         |

---

## Escopo da Refactoring

### Preservado (não tocar)

- `supabase/migrations/20240101000000_initial.sql` — tabela `users`
- `supabase/migrations/20240102000000_add-refresh-tokens.sql` — `refresh_tokens`
- `supabase/functions/api/middleware/auth.ts` — JWT middleware
- `supabase/functions/api/routes/auth.ts` — rotas de autenticação
- `supabase/functions/api/routes/users.ts` — rotas de usuários
- `supabase/functions/api/repositories/user.repository.ts`
- `supabase/functions/api/repositories/refresh-token.repository.ts`
- `supabase/functions/api/use-cases/auth.ts`
- `supabase/functions/api/use-cases/user/`
- `supabase/functions/_shared/domain/entities/user.entity.ts`
- `supabase/functions/_shared/domain/value-objects/email.vo.ts`
- `supabase/functions/_shared/domain/exceptions/domain.exception.ts`
- `apps/web/src/application/use-cases/auth/` — todos os use cases de auth
- `apps/web/src/domain/entities/user.entity.ts`
- `apps/web/src/domain/repositories/auth.repository.ts`
- `apps/web/src/infrastructure/http/auth.http-repository.ts`
- `apps/web/src/infrastructure/storage/local-storage-token.ts`
- `apps/web/src/presentation/contexts/auth.context.tsx`
- `apps/web/src/app/(auth)/` — páginas de login/registro

### Removido

- `supabase/functions/api/routes/services.ts`
- `supabase/functions/api/repositories/service.repository.ts`
- `supabase/functions/api/use-cases/service/`
- `supabase/functions/_shared/domain/entities/service.entity.ts`
- `apps/web/src/application/use-cases/service/`
- `apps/web/src/domain/entities/service.entity.ts`
- `apps/web/src/domain/repositories/service.repository.ts`
- `apps/web/src/infrastructure/http/service.http-repository.ts`
- `apps/web/src/presentation/components/services/`
- `apps/web/src/presentation/hooks/useServices.ts`
- `apps/web/src/app/(dashboard)/services/`
- Enums antigos em `validation/schemas.ts` relacionados a service

### Adicionado

**Backend (Hono routes + use-cases + repositories):**
- `/customers` — CRUD + soft delete
- `/service-catalog` — CRUD de tipos de serviço + categorias + preços
- `/quotes` — CRUD + approve
- `/quotes/:id/pdf` — exportação PDF
- `/projects` — CRUD + project_services
- `/projects/:id/contract-pdf` — exportação contrato PDF
- `/payments` — criar + marcar como pago
- `/fixed-costs` — CRUD
- `/financial` — entries + report

**Banco (migrations):**
- `20260403000001_drop_services_add_ppci_schema.sql`
- `20260403000002_seed_service_catalog.sql`

**Frontend:**
- Páginas: Clientes, Orçamentos, Projetos, Financeiro, Catálogo de Serviços
- Hooks, use-cases e repositórios HTTP para cada entidade

---

## Fluxos Principais

### Fluxo Comercial

```
POST /customers → POST /quotes (com items) → POST /quotes/:id/approve → [projeto criado] → POST /payments
```

### Fluxo Direto

```
POST /customers → POST /projects → POST /projects/:id/services → POST /payments
```

### Baixa de Pagamento

```
PUT /payments/:id/pay → [trigger cria financial_entry income]
```
