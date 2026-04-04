# Tasks: Refactoring Core — Domínio PPCI

**Feature:** F-REFCORE
**Milestone:** M7
**Status:** Pendente

**Legenda de dependências:** `depends: [T-XX, T-YY]`
**Execução:** Tasks sem dependências podem ser executadas em paralelo.

---

## Fase 1 — Banco de Dados

### T-01 — Migration: Drop old schema + Create new relational schema

**Depende de:** nada
**Arquivo:** `supabase/migrations/20260403000001_drop_services_add_ppci_schema.sql`

O que fazer:
- DROP TABLE services CASCADE (e enums antigos: services_tipo_enum, services_status_enum, services_forma_pagamento_enum)
- CREATE TYPE: quote_status_enum, project_status_enum, payment_status_enum, entry_type_enum
- CREATE TABLE: customers, service_category, services (catálogo), service_price, quotes, quote_items, projects, project_services, payments, fixed_costs, financial_entries
- Adicionar constraints FK, índices (customer_id, project_id, quote_id, status)
- Criar triggers:
  - `trg_quote_items_total`: recalcula `quote_items.total_price = quantity * unit_price` (BEFORE INSERT/UPDATE)
  - `trg_quotes_total_amount`: recalcula `quotes.total_amount` após mudanças em quote_items (AFTER INSERT/UPDATE/DELETE)
  - `trg_payment_paid_create_entry`: cria `financial_entry` income quando `payments.paid_date` é definido (AFTER UPDATE)

**Verificação:** `supabase db reset` sem erros; schema visível no Studio.

---

### T-02 — Migration seed: Categorias e tipos de serviço PPCI

**Depende de:** T-01
**Arquivo:** `supabase/migrations/20260403000002_seed_service_catalog.sql`

O que fazer:
- INSERT em `service_category`: Levantamento/Digitalização, Visitas/Reuniões, Projetos PPCI, Projetos Específicos, Renovação, Laudos, Consultoria, PET
- INSERT em `services` para cada tipo listado no planejamento:
  - Levantamento arquitetônico, Digitalização plantas físicas, Digitalização imagens eletrônicas, Cadastramento sistemas incêndio
  - Visita técnica, Reunião, Deslocamento
  - PCI PTS, PCI extintor, PCI com hidrantes, PCI edificação tombada
  - Sprinklers, Detecção, Escada pressurizada, Elevador emergência, Controle fumaça natural, Controle fumaça mecânico, Gases fixos, Resfriamento, Espuma, Canhão monitor
  - Renovação AVCB extintor, Renovação AVCB hidrantes, Renovação AVCB sistemas especiais
  - Laudo PBH extintor, Laudo PBH hidrantes, Laudo PBH sistemas especiais
  - Consultoria análise arquitetônica, Consultoria análise PCI, Assessoria PCI
  - PET risco mínimo, PET risco baixo, PET risco médio, PET risco alto, PET risco especial

**Verificação:** `SELECT COUNT(*) FROM services` retorna 35+ registros agrupados por category.

---

## Fase 2 — Backend: Shared Domain

### T-03 — Novas entidades de domínio compartilhado

**Depende de:** T-01
**Diretório:** `supabase/functions/_shared/domain/entities/`

O que fazer:
- Criar `customer.entity.ts` — interface Customer com campos do schema; método `isDeleted(): boolean`
- Criar `service-catalog.entity.ts` — interfaces ServiceCategory, ServiceCatalogItem, ServicePrice
- Criar `quote.entity.ts` — interfaces Quote, QuoteItem; enum QuoteStatus
- Criar `project.entity.ts` — interfaces Project, ProjectService; enum ProjectStatus
- Criar `payment.entity.ts` — interface Payment; enum PaymentStatus
- Criar `fixed-cost.entity.ts` — interface FixedCost
- Criar `financial-entry.entity.ts` — interface FinancialEntry; enum EntryType
- Atualizar `_shared/domain/index.ts` exportando as novas entidades

**Verificação:** TypeScript compila sem erros ao importar as novas entidades nos use-cases.

---

### T-04 — Remover entidades antigas de serviço

**Depende de:** T-03
**Atenção:** Só executar após T-03 e T-05 (garantir que nada mais importa o arquivo antigo)

O que fazer:
- Deletar `supabase/functions/_shared/domain/entities/service.entity.ts`
- Verificar e remover importações órfãs no `_shared/domain/index.ts`

**Verificação:** `grep -r "service.entity" supabase/` retorna zero resultados.

---

## Fase 3 — Backend: API (Hono)

> As tasks T-05 a T-11 são independentes entre si e podem ser executadas em paralelo após T-03.

### T-05 — Módulo Customers (route + use-cases + repository)

**Depende de:** T-01, T-03
**Arquivos:**
- `supabase/functions/api/repositories/customer.repository.ts`
- `supabase/functions/api/use-cases/customer/create-customer.ts`
- `supabase/functions/api/use-cases/customer/get-customer.ts`
- `supabase/functions/api/use-cases/customer/update-customer.ts`
- `supabase/functions/api/use-cases/customer/soft-delete-customer.ts`
- `supabase/functions/api/routes/customers.ts`

Endpoints:
- `GET /customers` — lista (excluindo deleted_at IS NOT NULL), suporta `?limit&offset`
- `POST /customers` — cria com validação RN03 (email ou phone obrigatório)
- `GET /customers/:id` — busca com projetos e orçamentos vinculados
- `PUT /customers/:id` — atualiza campos
- `DELETE /customers/:id` — soft delete (SET deleted_at = now())

Validação Zod: schema `createCustomerSchema`, `updateCustomerSchema` em `validation/schemas.ts`

**Verificação:** `POST /api/customers` cria registro; `DELETE /api/customers/:id` seta deleted_at; listagem não retorna deletado.

---

### T-06 — Módulo Service Catalog (route + use-cases + repository)

**Depende de:** T-01, T-03
**Arquivos:**
- `supabase/functions/api/repositories/service-catalog.repository.ts`
- `supabase/functions/api/use-cases/service-catalog/` (get, create, update, delete)
- `supabase/functions/api/routes/service-catalog.ts`

Endpoints:
- `GET /service-catalog` — lista categorias com seus serviços e preço vigente (JOIN service_price WHERE valid_to IS NULL)
- `GET /service-catalog/categories` — lista categorias
- `POST /service-catalog` — cria serviço
- `PUT /service-catalog/:id` — atualiza serviço
- `DELETE /service-catalog/:id` — soft delete (is_active = false)
- `POST /service-catalog/:id/prices` — adiciona novo preço (fecha valid_to do anterior)

**Verificação:** GET /service-catalog retorna todos os tipos PPCI agrupados por categoria.

---

### T-07 — Módulo Quotes (route + use-cases + repository)

**Depende de:** T-01, T-03
**Arquivos:**
- `supabase/functions/api/repositories/quote.repository.ts`
- `supabase/functions/api/use-cases/quote/` (create, get, update, delete, approve)
- `supabase/functions/api/routes/quotes.ts`

Endpoints:
- `GET /quotes` — lista com filtro `?status&customer_id&limit&offset`
- `POST /quotes` — cria com items (trigger calcula total_amount)
- `GET /quotes/:id` — detalhe com items
- `PUT /quotes/:id` — atualiza quote e items (apenas status !== approved/rejected)
- `DELETE /quotes/:id` — deleta (apenas draft)
- `POST /quotes/:id/approve` — body: `{ name, start_date? }` → cria project, copia items → project_services, retorna `{ project_id }`

Lógica de approve (transação):
1. Verificar status === 'draft' ou 'sent'
2. UPDATE quotes SET status = 'approved'
3. INSERT projects (customer_id, quote_id, name, start_date, total_value = quote.total_amount)
4. INSERT project_services (copiando cada quote_item)
5. Retornar project_id

**Verificação:** Approve cria projeto com project_services correspondentes; quote.status = approved.

---

### T-08 — Módulo Projects (route + use-cases + repository)

**Depende de:** T-01, T-03
**Arquivos:**
- `supabase/functions/api/repositories/project.repository.ts`
- `supabase/functions/api/use-cases/project/` (create, get, update, add-service, remove-service, update-service)
- `supabase/functions/api/routes/projects.ts`

Endpoints:
- `GET /projects` — lista com filtro `?status&customer_id&limit&offset`
- `POST /projects` — criação direta (sem quote)
- `GET /projects/:id` — detalhe com project_services e payments
- `PUT /projects/:id` — atualiza (bloqueia se status = finished — RN01)
- `POST /projects/:id/services` — adiciona serviço ao projeto
- `PUT /project-services/:id` — atualiza item de serviço
- `DELETE /project-services/:id` — remove item de serviço

RN01: PUT /projects/:id retorna 422 se status atual é 'finished'.
RN02: PUT /projects/:id com `status: 'finished'` verifica payments pendentes primeiro.

**Verificação:** Projeto criado diretamente; serviços adicionados; tentativa de finalizar com pagamento pendente retorna erro.

---

### T-09 — Módulo Payments (route + use-cases + repository)

**Depende de:** T-01, T-03
**Arquivos:**
- `supabase/functions/api/repositories/payment.repository.ts`
- `supabase/functions/api/use-cases/payment/` (create, get, pay)
- `supabase/functions/api/routes/payments.ts`

Endpoints:
- `GET /payments` — lista com filtro `?project_id&status`
- `POST /payments` — cria pagamento (status = pending por default)
- `PUT /payments/:id/pay` — body: `{ paid_date }` → status = paid; trigger cria financial_entry

**Verificação:** Marcar como pago cria financial_entry income; status muda para paid.

---

### T-10 — Módulo Fixed Costs (route + use-cases + repository)

**Depende de:** T-01, T-03
**Arquivos:**
- `supabase/functions/api/repositories/fixed-cost.repository.ts`
- `supabase/functions/api/use-cases/fixed-cost/` (create, get, update, delete)
- `supabase/functions/api/routes/fixed-costs.ts`

Endpoints:
- `GET /fixed-costs` — lista ativos
- `POST /fixed-costs` — cria
- `PUT /fixed-costs/:id` — atualiza
- `DELETE /fixed-costs/:id` — deleta (hard delete; sem histórico financeiro crítico)

**Verificação:** CRUD completo funciona; listar retorna apenas active = true.

---

### T-11 — Módulo Financial (route + repository)

**Depende de:** T-01, T-03
**Arquivos:**
- `supabase/functions/api/repositories/financial.repository.ts`
- `supabase/functions/api/routes/financial.ts`

Endpoints:
- `GET /financial/entries` — lista entries com filtro `?type&date_from&date_to&limit&offset`
- `GET /financial/report` — query: `?date_from&date_to` → retorna `{ total_income, total_expense, balance, entries_by_month: [] }`

**Verificação:** Report retorna saldo correto após pagamentos e custos.

---

### T-12 — Atualizar index.ts e remover rotas antigas

**Depende de:** T-05, T-06, T-07, T-08, T-09, T-10, T-11
**Arquivo:** `supabase/functions/api/index.ts`

O que fazer:
- Remover import e `app.route('/services', serviceRoutes)`
- Adicionar imports e routes para todos os novos módulos

**Verificação:** `GET /api/health` responde; rota `/api/services` retorna 404; todas novas rotas respondem.

---

### T-13 — Atualizar validation/schemas.ts

**Depende de:** T-03
**Arquivo:** `supabase/functions/api/validation/schemas.ts`

O que fazer:
- Remover schemas antigos: createServiceSchema, updateServiceSchema e todos os sub-schemas de service
- Adicionar: createCustomerSchema, updateCustomerSchema, createQuoteSchema, approveQuoteSchema, createProjectSchema, addProjectServiceSchema, createPaymentSchema, payPaymentSchema, createFixedCostSchema, updateFixedCostSchema, createServiceCatalogSchema, addServicePriceSchema

**Verificação:** Arquivo compila sem erros; schemas validam corretamente via `validateBody()`.

---

## Fase 4 — Frontend: Infraestrutura

### T-14 — Novas entidades de domínio frontend

**Depende de:** T-03
**Diretório:** `apps/web/src/domain/entities/`

O que fazer:
- Criar tipos TS (interfaces) para: Customer, Quote, QuoteItem, Project, ProjectService, Payment, FixedCost, ServiceCatalogItem, ServiceCategory, FinancialEntry, FinancialReport
- Criar interfaces de repositório: ICustomerRepository, IQuoteRepository, IProjectRepository, IPaymentRepository, IFixedCostRepository, IServiceCatalogRepository, IFinancialRepository
- Deletar `service.entity.ts` e `service.repository.ts` (antigos)

**Verificação:** TypeScript compila sem erros no frontend.

---

### T-15 — Novos use-cases frontend

**Depende de:** T-14
**Diretório:** `apps/web/src/application/use-cases/`

O que fazer (mesmo padrão de `GetServicesUseCase`):
- `customer/`: GetCustomersUseCase, GetCustomerUseCase, CreateCustomerUseCase, UpdateCustomerUseCase, DeleteCustomerUseCase
- `quote/`: GetQuotesUseCase, GetQuoteUseCase, CreateQuoteUseCase, UpdateQuoteUseCase, ApproveQuoteUseCase, DeleteQuoteUseCase
- `project/`: GetProjectsUseCase, GetProjectUseCase, CreateProjectUseCase, UpdateProjectUseCase, AddProjectServiceUseCase, RemoveProjectServiceUseCase
- `payment/`: GetPaymentsUseCase, CreatePaymentUseCase, PayPaymentUseCase
- `fixed-cost/`: GetFixedCostsUseCase, CreateFixedCostUseCase, UpdateFixedCostUseCase, DeleteFixedCostUseCase
- `service-catalog/`: GetServiceCatalogUseCase, CreateServiceUseCase, UpdateServiceUseCase
- `financial/`: GetFinancialEntriesUseCase, GetFinancialReportUseCase
- Deletar `service/` use-cases antigos

**Verificação:** Todos os use-cases instanciam sem erros no container.

---

### T-16 — Novos repositórios HTTP frontend

**Depende de:** T-14
**Diretório:** `apps/web/src/infrastructure/http/`

O que fazer (mesmo padrão de `ServiceHttpRepository`):
- Criar: customer.http-repository, quote.http-repository, project.http-repository, payment.http-repository, fixed-cost.http-repository, service-catalog.http-repository, financial.http-repository
- Deletar `service.http-repository.ts`

**Verificação:** Axios chama as URLs corretas; tipagem retornada corresponde às interfaces de domínio.

---

### T-17 — Atualizar DI container

**Depende de:** T-15, T-16
**Arquivo:** `apps/web/src/infrastructure/di/container.ts`

O que fazer:
- Remover instâncias de service (ServiceHttpRepository, GetServicesUseCase, etc.)
- Adicionar instâncias para todos os novos repositórios e use-cases

**Verificação:** Container instancia sem erros; useCustomers hook acessa container.customer.

---

## Fase 5 — Frontend: Páginas e Componentes

> T-18 a T-23 são independentes entre si (após T-17); podem ser feitas em paralelo.

### T-18 — Página Clientes

**Depende de:** T-17
**Arquivos:**
- `apps/web/src/presentation/hooks/useCustomers.ts`
- `apps/web/src/app/(dashboard)/customers/page.tsx`
- `apps/web/src/app/(dashboard)/customers/[id]/page.tsx`

O que fazer:
- Hook `useCustomers`: lista paginada via TanStack Query
- Página lista: tabela com nome, contato, nº projetos; botões criar/editar/excluir
- Página detalhe: dados do cliente + abas Orçamentos e Projetos vinculados

**Verificação:** Lista carrega clientes; soft delete remove da listagem; detalhe mostra histórico.

---

### T-19 — Página Orçamentos

**Depende de:** T-17
**Arquivos:**
- `apps/web/src/presentation/hooks/useQuotes.ts`
- `apps/web/src/app/(dashboard)/quotes/page.tsx`
- `apps/web/src/app/(dashboard)/quotes/new/page.tsx`
- `apps/web/src/app/(dashboard)/quotes/[id]/page.tsx`

O que fazer:
- Listagem com filtro por status
- Formulário de criação: selecionar cliente + adicionar itens (service_id, qty, unit_price)
- Total calculado no frontend ao digitar (mirror do trigger de banco)
- Detalhe: botão Aprovar (chama ApproveQuoteUseCase, redireciona para projeto criado)
- Botão exportar PDF (frontend-side com jsPDF ou react-pdf — ver T-25)

**Verificação:** Criar orçamento com 2 itens; total exibido corretamente; aprovação redireciona para projeto.

---

### T-20 — Página Projetos

**Depende de:** T-17
**Arquivos:**
- `apps/web/src/presentation/hooks/useProjects.ts`
- `apps/web/src/app/(dashboard)/projects/page.tsx`
- `apps/web/src/app/(dashboard)/projects/new/page.tsx`
- `apps/web/src/app/(dashboard)/projects/[id]/page.tsx`

O que fazer:
- Listagem com filtro por status
- Formulário de criação direta (sem quote)
- Detalhe: aba Serviços (adicionar/remover/editar project_services) + aba Pagamentos
- Gestão de pagamentos inline: lista, marcar como pago, adicionar pagamento
- Botão "Gerar contrato PDF" (ver T-26)
- Bloqueio visual de edição quando status = finished

**Verificação:** Criar projeto; adicionar serviços; marcar pagamento como pago; status finished bloqueia edição.

---

### T-21 — Página Financeiro

**Depende de:** T-17
**Arquivos:**
- `apps/web/src/presentation/hooks/useFinancial.ts`
- `apps/web/src/app/(dashboard)/financial/page.tsx`

O que fazer:
- Fluxo de caixa: seletor de período (mês/ano)
- Cards: Total Receitas, Total Custos, Saldo
- Tabela de lançamentos (financial_entries)
- Seção Custos Fixos: listagem + CRUD inline (usando useFixedCosts hook)

**Verificação:** Após pagar um pagamento, receita aparece no relatório do período correto.

---

### T-22 — Página Catálogo de Serviços

**Depende de:** T-17
**Arquivos:**
- `apps/web/src/presentation/hooks/useServiceCatalog.ts`
- `apps/web/src/app/(dashboard)/service-catalog/page.tsx`

O que fazer:
- Listagem agrupada por categoria (accordion ou tabs)
- Modal para criar/editar serviço (nome, categoria, tipo de unidade, preço)
- Toggle is_active para inativar serviço sem deletar

**Verificação:** Serviços do seed aparecem agrupados; criar novo serviço aparece na lista.

---

### T-23 — Atualizar navegação + remover páginas antigas

**Depende de:** T-18, T-19, T-20, T-21, T-22
**Arquivos:**
- `apps/web/src/presentation/components/layout/DashboardLayout.tsx`
- Deletar: `apps/web/src/app/(dashboard)/services/`
- Deletar: `apps/web/src/presentation/components/services/` (ServiceFilters, ServiceForm, ServiceTable)
- Deletar: `apps/web/src/presentation/hooks/useServices.ts`
- Deletar: `apps/web/src/application/validation/service.schemas.ts` (se existir separado)

O que fazer:
- Adicionar links de navegação: Clientes, Orçamentos, Projetos, Financeiro, Catálogo de Serviços
- Remover link "Serviços" antigo

**Verificação:** Navegação completa; nenhuma rota quebrada; TypeScript compila.

---

## Fase 6 — PDF

### T-25 — Exportação PDF: Orçamento

**Depende de:** T-19
**Decisão:** Frontend-side (react-pdf ou jsPDF) — ver design.md

O que fazer:
- Instalar `@react-pdf/renderer` ou `jspdf` no apps/web
- Criar template de orçamento: logo da empresa (placeholder), dados do cliente, tabela de itens, total, validade
- Botão "Exportar PDF" na página de detalhe do orçamento dispara download

**Verificação:** PDF gerado com dados corretos; tabela de itens formatada; total visível.

---

### T-26 — Exportação PDF: Contrato

**Depende de:** T-20, T-25 (reutiliza setup de PDF)

O que fazer:
- Template de contrato: dados do projeto, cliente, serviços, condições de pagamento, campo de assinatura
- Botão "Gerar Contrato" na página de detalhe do projeto

**Verificação:** PDF de contrato gerado com dados do projeto e lista de serviços.

---

## Ordem de Execução Sugerida

```
T-01 (banco)
  └─ T-02 (seed)
  └─ T-03 (entidades compartilhadas)
       ├─ T-04 (deletar antigo — aguardar T-12 antes)
       ├─ T-05..T-11 (módulos backend — em paralelo)
       │     └─ T-12 (atualizar index.ts)
       │     └─ T-13 (schemas Zod)
       └─ T-14 (entidades frontend)
             └─ T-15 (use-cases frontend)
                  └─ T-16 (repositórios HTTP)
                       └─ T-17 (DI container)
                            ├─ T-18 (clientes)
                            ├─ T-19 (orçamentos)
                            ├─ T-20 (projetos)
                            ├─ T-21 (financeiro)
                            └─ T-22 (catálogo)
                                 └─ T-23 (navegação + cleanup)
                                      ├─ T-25 (PDF orçamento)
                                      └─ T-26 (PDF contrato)
```
