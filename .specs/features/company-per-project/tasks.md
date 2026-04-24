Agent: tech-lead
Rules: @.ia/RULES.md

# Tasks: Company por Projeto

**Feature:** F-COMPANY
**Spec:** `.specs/features/company-per-project/spec.md`
**Status:** Pendente

**Legenda de dependências:** `depends: [T-XX]`
**Execução:** Tasks sem dependências podem ser executadas em paralelo.

---

## Fase 1 — Banco de Dados

### T-01 — Migration: Criar tabela companies + enum company_type

**Depende de:** nada
**Arquivo:** `supabase/migrations/20260423000001_create_companies.sql`

O que fazer:
- `CREATE TYPE company_type_enum AS ENUM ('internal', 'supplier', 'outsourced')`
- `CREATE TABLE companies` com: `id` (uuid PK, gen_random_uuid), `name` (text NOT NULL), `cnpj` (text NOT NULL), `responsible` (text NOT NULL), `type` (company_type_enum NOT NULL), `created_at`/`updated_at` (timestamptz, defaults)
- `CREATE UNIQUE INDEX ON companies (cnpj)`
- `CREATE INDEX ON companies (type)`

**Verificação:** `supabase db reset` sem erros; tabela `companies` visível no Studio com enum e constraints.

---

### T-02 — Migration: Adicionar company_id em projects, quotes, fixed_costs, variable_costs

**Depende de:** T-01
**Arquivo:** `supabase/migrations/20260423000002_add_company_id_references.sql`

O que fazer:
- `ALTER TABLE projects ADD COLUMN company_id uuid REFERENCES companies(id)`
- `ALTER TABLE quotes ADD COLUMN company_id uuid REFERENCES companies(id)`
- `ALTER TABLE fixed_costs ADD COLUMN company_id uuid REFERENCES companies(id)`
- `ALTER TABLE variable_costs ADD COLUMN company_id uuid REFERENCES companies(id)`
- `CREATE INDEX ON projects (company_id)`
- `CREATE INDEX ON quotes (company_id)`
- `CREATE INDEX ON fixed_costs (company_id)`
- `CREATE INDEX ON variable_costs (company_id)`

**Verificação:** Todas as 4 tabelas possuem `company_id` nullable; FKs apontam para `companies(id)`.

---

## Fase 2 — Backend: Shared Domain

### T-03 — Entidade Company no domínio compartilhado

**Depende de:** T-01
**Arquivos:**
- `supabase/functions/_shared/domain/entities/company.entity.ts`
- `supabase/functions/_shared/domain/index.ts` (atualizar barrel)

O que fazer:
- Criar `company.entity.ts` com:
  - `type CompanyType = 'internal' | 'supplier' | 'outsourced'`
  - `interface Company { id, name, cnpj, responsible, type: CompanyType, created_at, updated_at }`
- Exportar do barrel `index.ts`

**Verificação:** TypeScript compila; importação de `Company` funciona no backend e frontend.

---

### T-04 — Atualizar entidades Project e Quote com company_id

**Depende de:** T-02, T-03
**Arquivos:**
- `supabase/functions/_shared/domain/entities/project.entity.ts`
- `supabase/functions/_shared/domain/entities/quote.entity.ts`

O que fazer:
- Adicionar `company_id?: string | null` na interface `Project`
- Adicionar `company_id?: string | null` na interface `Quote`

**Verificação:** Tipos atualizados; nenhum erro de compilação nos use-cases que importam essas entidades.

---

### T-05 — Atualizar entidades FixedCost e VariableCost com company_id

**Depende de:** T-02, T-03
**Arquivos:**
- `supabase/functions/_shared/domain/entities/fixed-cost.entity.ts`
- `supabase/functions/_shared/domain/entities/variable-cost.entity.ts`

O que fazer:
- Adicionar `company_id?: string | null` na interface `FixedCost`
- Adicionar `company_id?: string | null` na interface `VariableCost`

**Verificação:** Tipos atualizados; compilação sem erros.

---

## Fase 3 — Backend: API (Hono) — CRUD Companies

### T-06 — Repository: company.repository.ts

**Depende de:** T-03
**Arquivo:** `supabase/functions/api/repositories/company.repository.ts`

O que fazer:
- `findAll(params: { type?: CompanyType, limit, offset })` — lista com filtro opcional por tipo; `COUNT(*) OVER()::int AS total_count` para paginação
- `findById(id)` — busca por ID
- `save(data: { name, cnpj, responsible, type })` — INSERT RETURNING *
- `update(id, data: { name?, cnpj?, responsible?, type? })` — UPDATE com COALESCE para campos parciais
- `delete(id)` — verifica vínculos (projects, quotes, fixed_costs, variable_costs) antes de deletar; lança `conflict()` se houver
- Mapper `toCompany(row): Company`

**Verificação:** CRUD funciona via SQL direto; delete com vínculos retorna 409.

---

### T-07 — Use cases: Company

**Depende de:** T-06
**Arquivos:**
- `supabase/functions/api/use-cases/company/create-company.ts`
- `supabase/functions/api/use-cases/company/get-company.ts`
- `supabase/functions/api/use-cases/company/update-company.ts`
- `supabase/functions/api/use-cases/company/delete-company.ts`

O que fazer:
- `createCompany(dto)` → `CompanyRepository.save(dto)`
- `getAllCompanies(params)` → `CompanyRepository.findAll(params)`
- `getCompanyById(id)` → `CompanyRepository.findById(id)`, lança `notFound` se null
- `updateCompany(id, dto)` → `CompanyRepository.update(id, dto)`, lança `notFound` se null
- `deleteCompany(id)` → `CompanyRepository.delete(id)` (vínculos já verificados no repo)

**Verificação:** Cada use-case delega corretamente ao repository.

---

### T-08 — Zod schemas: Company + atualizar schemas de Project, Quote, FixedCost, VariableCost

**Depende de:** T-03, T-04, T-05
**Arquivo:** `supabase/functions/api/validation/schemas.ts`

O que fazer:
- Criar `companyTypeSchema = z.enum(['internal', 'supplier', 'outsourced'])`
- Criar `createCompanySchema`: `name: z.string().min(1)`, `cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/)`, `responsible: z.string().min(1)`, `type: companyTypeSchema`
- Criar `updateCompanySchema`: todos opcionais com `.optional()`
- Atualizar `createProjectSchema`: adicionar `company_id: z.string().uuid()`
- Atualizar `updateProjectSchema`: adicionar `company_id: z.string().uuid().optional()`
- Atualizar `createQuoteSchema`: adicionar `company_id: z.string().uuid()`
- Atualizar `updateQuoteSchema`: adicionar `company_id: z.string().uuid().optional()`
- Atualizar `createFixedCostSchema`: adicionar `company_id: z.string().uuid().optional()`
- Atualizar `updateFixedCostSchema`: adicionar `company_id: z.string().uuid().optional().nullable()`
- Atualizar `createVariableCostSchema`: adicionar `company_id: z.string().uuid().optional()`
- Atualizar `updateVariableCostSchema`: adicionar `company_id: z.string().uuid().optional().nullable()`
- Inferir tipos: `CompanyCreateDto`, `CompanyUpdateDto`

**Verificação:** Schemas validam corretamente; `company_id` obrigatório em createProject/createQuote; CNPJ regex rejeita formato inválido.

---

### T-09 — Route: companies.ts

**Depende de:** T-07, T-08
**Arquivo:** `supabase/functions/api/routes/companies.ts`

O que fazer:
- `GET /companies` — lista com `?type=internal|supplier|outsourced&limit&offset`
- `POST /companies` — cria com validação `createCompanySchema`
- `GET /companies/:id` — busca por ID
- `PUT /companies/:id` — atualiza com `updateCompanySchema`
- `DELETE /companies/:id` — deleta (bloqueado se houver vínculos)

**Verificação:** CRUD completo responde; DELETE com vínculos retorna 409.

---

### T-10 — Registrar rota /companies no index.ts

**Depende de:** T-09
**Arquivo:** `supabase/functions/api/index.ts`

O que fazer:
- Import `companyRoutes` from `./routes/companies.ts`
- `app.route('/companies', companyRoutes)`

**Verificação:** `GET /api/companies` responde; health check ok.

---

## Fase 4 — Backend: API — Ajustes em Projects e Quotes

### T-11 — Repository + use-case: Adicionar company_id em Project

**Depende de:** T-04, T-08
**Arquivos:**
- `supabase/functions/api/repositories/project.repository.ts`
- `supabase/functions/api/use-cases/project/create-project.ts`
- `supabase/functions/api/use-cases/project/update-project.ts`

O que fazer:
- `ProjectRepository.save()`: adicionar `company_id` no INSERT
- `ProjectRepository.update()`: adicionar `company_id` no UPDATE com COALESCE
- `ProjectRepository.findAll()`: adicionar filtro `company_id` opcional
- Mapper `toProject()`: mapear `company_id`
- `createProject()`: passar `company_id` do DTO para o repository
- `updateProject()`: validar que se projeto está `finished`, `company_id` não pode ser alterado; verificar que `company_id` referencia company do tipo `internal` (query `SELECT type FROM companies WHERE id = $1`)

**Verificação:** Criar projeto com `company_id` funciona; alterar `company_id` em projeto `finished` retorna erro; `company_id` de tipo não-interno retorna erro.

---

### T-12 — Repository + use-case: Adicionar company_id em Quote

**Depende de:** T-04, T-08
**Arquivos:**
- `supabase/functions/api/repositories/quote.repository.ts`
- `supabase/functions/api/use-cases/quote/create-quote.ts`
- `supabase/functions/api/use-cases/quote/update-quote.ts`
- `supabase/functions/api/use-cases/quote/approve-quote.ts`

O que fazer:
- `QuoteRepository.save()`: adicionar `company_id` no INSERT
- `QuoteRepository.update()`: adicionar `company_id` no UPDATE com COALESCE
- Mapper `toQuote()`: mapear `company_id`
- `createQuote()`: passar `company_id` do DTO; validar tipo `internal`
- `updateQuote()`: validar tipo `internal` se `company_id` fornecido
- `approveQuote()`: ao criar projeto, copiar `quotes.company_id` para `projects.company_id`

**Verificação:** Criar orçamento com `company_id` funciona; approve copia `company_id` para projeto; tipo não-interno rejeitado.

---

### T-13 — Repository: Adicionar company_id em FixedCost

**Depende de:** T-05, T-08
**Arquivos:**
- `supabase/functions/api/repositories/fixed-cost.repository.ts`
- `supabase/functions/api/use-cases/fixed-cost/create-fixed-cost.ts`
- `supabase/functions/api/use-cases/fixed-cost/update-fixed-cost.ts`

O que fazer:
- `FixedCostRepository.save()`: adicionar `company_id` no INSERT
- `FixedCostRepository.update()`: adicionar `company_id` no UPDATE
- Mapper: mapear `company_id`
- `findAll()`: adicionar filtro `company_id` opcional

**Verificação:** Criar/editar custo fixo com `company_id` funciona; listagem filtra por company.

---

### T-14 — Repository: Adicionar company_id em VariableCost

**Depende de:** T-05, T-08
**Arquivos:**
- `supabase/functions/api/repositories/variable-cost.repository.ts`
- `supabase/functions/api/use-cases/variable-cost/create-variable-cost.ts`
- `supabase/functions/api/use-cases/variable-cost/update-variable-cost.ts`

O que fazer:
- `VariableCostRepository.save()`: adicionar `company_id` no INSERT
- `VariableCostRepository.update()`: adicionar `company_id` no UPDATE
- Mapper: mapear `company_id`
- `findAll()`: adicionar filtro `company_id` opcional

**Verificação:** Criar/editar custo variável com `company_id` funciona; listagem filtra por company.

---

## Fase 5 — Backend: Filtros Financeiros por Company

### T-15 — Repository: Filtro por company no módulo Financial

**Depende de:** T-11, T-13, T-14
**Arquivo:** `supabase/functions/api/repositories/financial.repository.ts`

O que fazer:
- `findEntries()`: adicionar parâmetro `company_id?` opcional
  - Receitas: JOIN `payments p JOIN projects pr ON pr.id = p.project_id` filtrando `pr.company_id = $company_id`
  - Despesas fixas: filtrar `fixed_costs.company_id = $company_id`; **excluir** custos com `company_id` nulo quando há filtro
  - Despesas variáveis: filtrar `variable_costs.company_id = $company_id`; **excluir** custos com `company_id` nulo quando há filtro
- `getReport()`: mesmo filtro `company_id?` nas mesmas condições
- Impostos: filtro por company considera apenas `variable_costs` com `category = 'tax'`, ignorando `project_services.tax_deduction`

**Verificação:** Relatório com filtro de company retorna apenas receitas/despesas da company; custos gerais (company_id null) aparecem apenas sem filtro.

---

### T-16 — Route: Adicionar query param company_id no endpoint financial

**Depende de:** T-15
**Arquivo:** `supabase/functions/api/routes/financial.ts`

O que fazer:
- `GET /financial/entries`: aceitar `?company_id=uuid`
- `GET /financial/report`: aceitar `?company_id=uuid`
- Passar `company_id` para o repository

**Verificação:** `GET /financial/report?date_from=...&date_to=...&company_id=...` retorna dados filtrados.

---

## Fase 6 — Frontend: Infraestrutura Company

### T-17 — Domain: Interface ICompanyRepository + DTOs

**Depende de:** T-03
**Arquivo:** `apps/web/src/domain/repositories/company.repository.ts`

O que fazer:
- `CompanyType` type alias: `'internal' | 'supplier' | 'outsourced'`
- `Company` interface (id, name, cnpj, responsible, type, created_at, updated_at)
- `CreateCompanyDto` interface (name, cnpj, responsible, type)
- `UpdateCompanyDto` interface (name?, cnpj?, responsible?, type?)
- `ICompanyRepository` interface com métodos: `list(params)`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`

**Verificação:** Tipos compilam sem erros; interface compatível com a entidade do shared domain.

---

### T-18 — Use cases: Company (frontend)

**Depende de:** T-17
**Arquivo:** `apps/web/src/application/use-cases/company/company.use-cases.ts`

O que fazer:
- `GetCompaniesUseCase` — `execute(params)` → `repo.list(params)`
- `GetCompanyUseCase` — `execute(id)` → `repo.getById(id)`
- `CreateCompanyUseCase` — `execute(dto)` → `repo.create(dto)`
- `UpdateCompanyUseCase` — `execute(id, dto)` → `repo.update(id, dto)`
- `DeleteCompanyUseCase` — `execute(id)` → `repo.delete(id)`

**Verificação:** Classes instanciam sem erros; métodos delegam ao repositório.

---

### T-19 — HTTP Repository: Company

**Depende de:** T-17
**Arquivo:** `apps/web/src/infrastructure/http/company.http-repository.ts`

O que fazer:
- `CompanyHttpRepository implements ICompanyRepository`
- `list(params)` → `GET /companies?type=...&limit=...&offset=...`
- `getById(id)` → `GET /companies/:id`
- `create(dto)` → `POST /companies`
- `update(id, dto)` → `PUT /companies/:id`
- `delete(id)` → `DELETE /companies/:id`

**Verificação:** Métodos chamam URLs corretas com Axios; tipos de retorno compatíveis.

---

### T-20 — DI Container: Registrar Company

**Depende de:** T-18, T-19
**Arquivo:** `apps/web/src/infrastructure/di/container.ts`

O que fazer:
- Instanciar `CompanyHttpRepository`
- Instanciar use cases de Company
- Adicionar `container.companies = { list, get, create, update, delete }`

**Verificação:** `container.companies.list.execute()` não lança erro.

---

### T-21 — Atualizar DTOs de Project, Quote, FixedCost, VariableCost no frontend

**Depende de:** T-04, T-05
**Arquivos:**
- `apps/web/src/domain/repositories/project.repository.ts`
- `apps/web/src/domain/repositories/quote.repository.ts`
- `apps/web/src/domain/repositories/fixed-cost.repository.ts`
- `apps/web/src/domain/repositories/variable-cost.repository.ts`

O que fazer:
- Adicionar `company_id` em `CreateProjectDto` (obrigatório) e `UpdateProjectDto` (opcional)
- Adicionar `company_id` em `CreateQuoteDto` (obrigatório) e `UpdateQuoteDto` (opcional)
- Adicionar `company_id?` em `CreateFixedCostDto` e `UpdateFixedCostDto`
- Adicionar `company_id?` em `CreateVariableCostDto` e `UpdateVariableCostDto`
- Adicionar `company_id?` nos filtros de listagem de financial

**Verificação:** Tipos compilam sem erros.

---

## Fase 7 — Frontend: Página Company

### T-22 — Hook: useCompanies

**Depende de:** T-20
**Arquivo:** `apps/web/src/presentation/hooks/useCompanies.ts`

O que fazer:
- `useCompanies(params?)` — `useQuery` com `container.companies.list.execute(params)`
- `useCompany(id)` — `useQuery` com `container.companies.get.execute(id)`
- `useCreateCompany()` — `useMutation` com `container.companies.create.execute`; invalida query `['companies']`
- `useUpdateCompany()` — `useMutation` com `container.companies.update.execute`; invalida queries
- `useDeleteCompany()` — `useMutation` com `container.companies.delete.execute`; invalida queries

**Verificação:** Hooks retornam dados tipados; mutações invalidam cache corretamente.

---

### T-23 — Página: /companies com 3 abas

**Depende de:** T-22
**Arquivos:**
- `apps/web/src/app/(dashboard)/companies/page.tsx`
- `apps/web/src/app/(dashboard)/companies/layout.tsx` (se necessário)

O que fazer:
- Página com 3 abas: "Interna", "Fornecedores", "Terceirizados"
- Aba ativa padrão: "Interna"
- Cada aba renderiza tabela com colunas: Nome, CNPJ, Responsável, Ações (editar, remover)
- Botão "Nova Company" no topo da aba abre modal de criação
- Modal de criação: campos `name`, `cnpj`, `responsible`, `type` (preenchido conforme aba ativa: `internal`, `supplier`, `outsourced`)
- Modal de edição: mesmos campos, preenchidos com dados existentes
- Confirmação de remoção: dialog de confirmação; erro exibido se houver vínculos (409)
- Filtros por tipo passados via `useCompanies({ type: activeTab })`

**Verificação:** Abas filtram corretamente; CRUD completo funciona; remoção com vínculos exibe erro; aba padrão é "Interna" (REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-015).

---

### T-24 — Navegação: Adicionar "Company" no sidebar

**Depende de:** T-23
**Arquivo:** `apps/web/src/presentation/components/layout/DashboardLayout.tsx`

O que fazer:
- Adicionar item `{ href: '/companies', label: 'Company' }` no array `navItems`

**Verificação:** Link "Company" aparece na navegação; clique navega para `/companies`.

---

## Fase 8 — Frontend: Integração de Company em Projetos e Orçamentos

### T-25 — Hook: useCompanies para dropdown (filtrar tipo internal)

**Depende de:** T-22
**Arquivo:** `apps/web/src/presentation/hooks/useCompanies.ts` (extensão)

O que fazer:
- Exportar `useInternalCompanies()` — `useQuery` com `container.companies.list.execute({ type: 'internal' })` para uso em dropdowns de projeto e orçamento
- Exportar `useCreateInternalCompany()` — `useMutation` com `type` pré-definido como `'internal'`; invalida query `['companies']`

**Verificação:** `useInternalCompanies()` retorna apenas companies do tipo `internal`.

---

### T-26 — UI: Dropdown de Company nos formulários de Projeto

**Depende de:** T-25, T-21
**Arquivos:**
- `apps/web/src/app/(dashboard)/projects/new/page.tsx`
- `apps/web/src/app/(dashboard)/projects/[id]/page.tsx`

O que fazer:
- Adicionar campo `company_id` no formulário de criação de projeto (select/dropdown com `useInternalCompanies`)
- Adicionar campo `company_id` no formulário de edição de projeto (se status !== `finished`)
- Botão "Criar Company" inline no dropdown abre modal rápido com `type` pré-definido `'internal'`
- Se projeto status `finished`, campo `company_id` desabilitado

**Verificação:** Dropdown lista apenas companies internas; seleção enviada no payload; criação inline funciona; bloqueio em projeto finished (REQ-016, REQ-017, REQ-018).

---

### T-27 — UI: Dropdown de Company nos formulários de Orçamento

**Depende de:** T-25, T-21
**Arquivos:**
- `apps/web/src/app/(dashboard)/quotes/new/page.tsx`
- `apps/web/src/app/(dashboard)/quotes/[id]/page.tsx`

O que fazer:
- Adicionar campo `company_id` no formulário de criação de orçamento (select/dropdown com `useInternalCompanies`)
- Adicionar campo `company_id` no formulário de edição de orçamento
- Botão "Criar Company" inline no dropdown (mesmo padrão de T-26)

**Verificação:** Dropdown lista apenas companies internas; `company_id` enviado no payload (REQ-016, REQ-017, REQ-018).

---

### T-28 — UI: Company_id nos formulários de FixedCost e VariableCost

**Depende de:** T-21
**Arquivos:**
- Modal de criação/edição de FixedCost (dentro de `apps/web/src/app/(dashboard)/financial/page.tsx`)
- Modal de criação/edição de VariableCost (mesma página)

O que fazer:
- Adicionar campo `company_id` opcional nos modais de FixedCost e VariableCost
- Dropdown lista todas as companies (todos os tipos, sem filtro)
- Opção "Nenhum (custo geral)" para `company_id` nulo

**Verificação:** Custos com e sem `company_id` são criados corretamente; dropdown lista todos os tipos.

---

## Fase 9 — PDFs

### T-29 — PDF: Exibir CNPJ da company em orçamentos

**Depende de:** T-12, T-27
**Arquivo:** `apps/web/src/presentation/components/pdf/quote-pdf.tsx`

O que fazer:
- Adicionar prop `companyCnpj?: string` ao componente `QuotePdf`
- Exibir CNPJ no header, abaixo do `companyName` (formato: `CNPJ: xx.xxx.xxx/xxxx-xx`)
- Atualizar `QuoteDownloadButton` para passar `companyCnpj` a partir da company vinculada ao orçamento

**Verificação:** PDF gerado exibe CNPJ da company; orçamentos sem company (legacy) não exibem CNPJ (REQ-019).

---

### T-30 — PDF: Exibir CNPJ da company em contratos

**Depende de:** T-11, T-26
**Arquivo:** `apps/web/src/presentation/components/pdf/contract-pdf.tsx`

O que fazer:
- Adicionar prop `companyCnpj?: string` ao componente `ContractPdf`
- Exibir CNPJ no header, abaixo do `companyName`
- Atualizar `ContractDownloadButton` para passar `companyCnpj` a partir da company vinculada ao projeto

**Verificação:** PDF de contrato exibe CNPJ da company; projetos sem company (legacy) não exibem CNPJ (REQ-019).

---

## Fase 10 — Frontend: Filtro Financeiro por Company

### T-31 — UI: Filtro de Company na página Financeiro

**Depende de:** T-16, T-21
**Arquivos:**
- `apps/web/src/presentation/hooks/useFinancial.ts`
- `apps/web/src/app/(dashboard)/financial/page.tsx`

O que fazer:
- Adicionar dropdown de filtro por company (lista todas as companies) no topo da página financeiro
- Passar `company_id` como parâmetro para `useFinancialReport` e `useFinancialEntries`
- Atualizar hooks para aceitar e repassar `company_id` nos parâmetros
- Sem filtro: exibe todos os dados (incluindo custos gerais com `company_id` nulo)
- Com filtro: exibe apenas dados da company selecionada (exclui custos gerais)

**Verificação:** Filtro de company na página financeiro filtra receitas e despesas; custos gerais aparecem apenas sem filtro (REQ-020, REQ-021, REQ-022).

---

## Ordem de Execução Sugerida

```
T-01 (migration: companies)
├─ T-02 (migration: company_id refs)
│  ├─ T-04 (entity: project + company_id) ───┐
│  ├─ T-05 (entity: fixed/variable + co) ───┐│
│  └─ T-08 (zod schemas) ──────────────────┤│
├─ T-03 (entity: company)                  ││
│  ├─ T-06 (repo: company)                 ││
│  │  └─ T-07 (use-cases: company)         ││
│  │     └─ T-09 (route: companies)        ││
│  │        └─ T-10 (index.ts: register)   ││
│  ├─ T-17 (domain: ICompanyRepository)    ││
│  │  ├─ T-18 (use-cases: frontend)        ││
│  │  ├─ T-19 (http repo: company)         ││
│  │  └─ T-20 (DI container)              ││
│  │     └─ T-22 (hook: useCompanies)      ││
│  │        ├─ T-23 (page: /companies)     ││
│  │        │  └─ T-24 (nav: sidebar)      ││
│  │        └─ T-25 (hook: internal comp)  ││
│  │           ├─ T-26 (UI: project form)  ││
│  │           ├─ T-27 (UI: quote form)    ││
│  │           └─ T-28 (UI: cost modals)   ││
│  └─ [paralelo com T-17+]                 ││
├─ T-11 (repo+uc: project company_id) ←────┤│
├─ T-12 (repo+uc: quote company_id) ←──────┘│
├─ T-13 (repo+uc: fixed-cost company_id) ←──┘
├─ T-14 (repo+uc: variable-cost company_id)
└─ T-15 (repo: financial filter by company)
   └─ T-16 (route: financial company_id param)
      └─ T-31 (UI: financial company filter)

T-29 (PDF: quote CNPJ) — depende de T-12 + T-27
T-30 (PDF: contract CNPJ) — depende de T-11 + T-26
```

**Paralelizáveis:**
- T-01 primeiro, depois T-02 e T-03 em paralelo
- T-04, T-05 em paralelo (ambos dependem de T-02 + T-03)
- T-11, T-12, T-13, T-14 em paralelo (dependem de T-04/T-05 + T-08)
- T-06 + T-17 em paralelo (ambos dependem de T-03)
- T-22 + T-11/12/13/14 em paralelo (ramos independentes)
- T-29 e T-30 em paralelo (dependências diferentes)
- T-23, T-26, T-27, T-28 em paralelo após suas dependências

**Caminho crítico:** T-01 → T-03 → T-06 → T-07 → T-09 → T-10 (backend companies) + T-01 → T-03 → T-17 → T-20 → T-22 → T-23 → T-24 (frontend companies page)
