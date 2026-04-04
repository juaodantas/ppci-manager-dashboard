# Design: Refactoring Core — Domínio PPCI

**Feature:** F-REFCORE
**Tipo:** Large — multi-componente, novo schema de banco, novas entidades, novos endpoints, novas páginas

---

## Schema de Banco (novo)

### Tabelas preservadas

```sql
users           -- id, name, email, password_hash, created_at, updated_at
refresh_tokens  -- id, user_id, token, expires_at, revoked_at, created_at
```

### Tabelas novas

```sql
customers
  id UUID PK
  name VARCHAR(255) NOT NULL
  document VARCHAR(20)           -- CPF ou CNPJ (opcional)
  email VARCHAR(255)
  phone VARCHAR(20)
  deleted_at TIMESTAMP           -- soft delete
  created_at TIMESTAMP
  updated_at TIMESTAMP

service_category
  id UUID PK
  name VARCHAR(100) NOT NULL
  description TEXT

services                         -- catálogo de tipos de serviço (NÃO execuções)
  id UUID PK
  category_id UUID FK → service_category
  name VARCHAR(255) NOT NULL
  description TEXT
  unit_type VARCHAR(50)          -- ex: 'un', 'm²', 'hora'
  is_active BOOLEAN DEFAULT true

service_price
  id UUID PK
  service_id UUID FK → services
  price_per_unit DECIMAL(10,2) NOT NULL
  minimum_price DECIMAL(10,2)
  valid_from DATE NOT NULL
  valid_to DATE                  -- NULL = vigente

quotes
  id UUID PK
  customer_id UUID FK → customers
  status quote_status_enum       -- draft | sent | approved | rejected
  total_amount DECIMAL(10,2)     -- calculado via trigger
  discount DECIMAL(10,2) DEFAULT 0
  valid_until DATE
  notes TEXT
  created_at TIMESTAMP
  updated_at TIMESTAMP

quote_items
  id UUID PK
  quote_id UUID FK → quotes ON DELETE CASCADE
  service_id UUID FK → services
  description TEXT               -- sobrescreve nome do serviço se preenchido
  quantity DECIMAL(10,3) NOT NULL
  unit_price DECIMAL(10,2) NOT NULL
  total_price DECIMAL(10,2)      -- calculado: quantity * unit_price

projects
  id UUID PK
  customer_id UUID FK → customers
  quote_id UUID FK → quotes      -- nullable: projetos criados diretamente
  name VARCHAR(255) NOT NULL
  description TEXT
  status project_status_enum     -- planning | in_progress | finished | canceled
  start_date DATE
  end_date DATE
  total_value DECIMAL(10,2)
  created_at TIMESTAMP
  updated_at TIMESTAMP

project_services
  id UUID PK
  project_id UUID FK → projects ON DELETE CASCADE
  service_id UUID FK → services
  description TEXT
  quantity DECIMAL(10,3) NOT NULL
  unit_price DECIMAL(10,2) NOT NULL
  total_price DECIMAL(10,2)      -- calculado: quantity * unit_price

payments
  id UUID PK
  project_id UUID FK → projects
  amount DECIMAL(10,2) NOT NULL
  due_date DATE NOT NULL
  paid_date DATE
  status payment_status_enum     -- pending | paid | overdue
  payment_method VARCHAR(50)
  notes TEXT
  created_at TIMESTAMP
  updated_at TIMESTAMP

fixed_costs
  id UUID PK
  name VARCHAR(255) NOT NULL
  amount DECIMAL(10,2) NOT NULL
  due_day SMALLINT NOT NULL      -- dia do mês (1-31)
  category VARCHAR(100)
  active BOOLEAN DEFAULT true
  created_at TIMESTAMP
  updated_at TIMESTAMP

financial_entries
  id UUID PK
  type entry_type_enum           -- income | expense
  source_type VARCHAR(50)        -- 'payment' | 'fixed_cost'
  source_id UUID                 -- ID do payment ou fixed_cost
  amount DECIMAL(10,2) NOT NULL
  date DATE NOT NULL
  description TEXT
  created_at TIMESTAMP
```

### Enums

```sql
CREATE TYPE quote_status_enum AS ENUM ('draft', 'sent', 'approved', 'rejected');
CREATE TYPE project_status_enum AS ENUM ('planning', 'in_progress', 'finished', 'canceled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE entry_type_enum AS ENUM ('income', 'expense');
```

### Triggers

```sql
-- 1. Recalcula quotes.total_amount ao inserir/atualizar/deletar quote_items
-- 2. Recalcula quote_items.total_price ao inserir/atualizar
-- 3. Cria financial_entry quando payments.paid_date é definido
-- 4. Atualiza payments.status para 'overdue' quando due_date < hoje e status = 'pending'
```

---

## Estrutura de Arquivos (Backend)

### Novas rotas no index.ts

```typescript
// supabase/functions/api/index.ts (adicionado ao existente)
app.route('/customers', customerRoutes)
app.route('/service-catalog', serviceCatalogRoutes)
app.route('/quotes', quoteRoutes)
app.route('/projects', projectRoutes)
app.route('/payments', paymentRoutes)
app.route('/fixed-costs', fixedCostRoutes)
app.route('/financial', financialRoutes)
// REMOVIDO: app.route('/services', serviceRoutes)
```

### Novos repositórios (mesmo padrão do UserRepository)

```
supabase/functions/api/repositories/
  customer.repository.ts
  service-catalog.repository.ts
  quote.repository.ts
  project.repository.ts
  payment.repository.ts
  fixed-cost.repository.ts
  financial.repository.ts
```

### Novos use-cases (mesmo padrão)

```
supabase/functions/api/use-cases/
  customer/   create | get | update | soft-delete
  quote/      create | get | update | approve | delete
  project/    create | get | update | add-service | remove-service
  payment/    create | get | pay
  fixed-cost/ create | get | update | delete
  financial/  get-entries | get-report
```

### Novas entidades compartilhadas

```
supabase/functions/_shared/domain/entities/
  customer.entity.ts
  service-catalog.entity.ts    -- ServiceCategory + ServiceCatalogItem + ServicePrice
  quote.entity.ts              -- Quote + QuoteItem
  project.entity.ts            -- Project + ProjectService
  payment.entity.ts
  fixed-cost.entity.ts
  financial-entry.entity.ts
```

---

## Estrutura de Arquivos (Frontend)

### Novas páginas

```
apps/web/src/app/(dashboard)/
  customers/
    page.tsx                   -- lista clientes
    [id]/page.tsx              -- detalhe: orçamentos + projetos do cliente
  quotes/
    page.tsx                   -- lista orçamentos
    new/page.tsx               -- criar orçamento
    [id]/page.tsx              -- detalhe + approve
  projects/
    page.tsx                   -- lista projetos
    new/page.tsx               -- criar projeto
    [id]/page.tsx              -- detalhe + serviços + pagamentos
  financial/
    page.tsx                   -- fluxo de caixa + custos fixos
  service-catalog/
    page.tsx                   -- catálogo de serviços por categoria
```

### Novos hooks (mesmo padrão useServices.ts)

```
apps/web/src/presentation/hooks/
  useCustomers.ts
  useQuotes.ts
  useProjects.ts
  usePayments.ts
  useFixedCosts.ts
  useFinancial.ts
  useServiceCatalog.ts
```

### Novas entidades de domínio frontend

```
apps/web/src/domain/entities/
  customer.entity.ts
  quote.entity.ts
  project.entity.ts
  payment.entity.ts
  fixed-cost.entity.ts
  service-catalog.entity.ts
  financial-entry.entity.ts
```

### Novos repositórios HTTP

```
apps/web/src/infrastructure/http/
  customer.http-repository.ts
  quote.http-repository.ts
  project.http-repository.ts
  payment.http-repository.ts
  fixed-cost.http-repository.ts
  service-catalog.http-repository.ts
  financial.http-repository.ts
```

### Atualização do DI container

```typescript
// container.ts — adicionar junto ao existente auth/user
customer: { get, create, update, softDelete }
quote: { get, create, update, approve, delete }
project: { get, create, update, addService, removeService }
payment: { get, create, pay }
fixedCost: { get, create, update, delete }
serviceCatalog: { get, create, update, delete }
financial: { getEntries, getReport }
```

---

## DTOs e Validação (Zod — backend)

### POST /customers

```typescript
{ name: string, document?: string, email?: string, phone?: string }
// RN03: email ou phone obrigatório (refine)
```

### POST /quotes

```typescript
{
  customer_id: uuid,
  valid_until?: date,
  discount?: number,
  notes?: string,
  items: [{ service_id: uuid, quantity: number, unit_price: number, description?: string }]
}
```

### POST /quotes/:id/approve

```typescript
// body: { name: string, start_date?: date }
// response: { project_id: uuid }
// Ação: status → 'approved', cria project, copia items para project_services
```

### POST /projects

```typescript
{ customer_id: uuid, quote_id?: uuid, name: string, description?: string, start_date?: date, total_value?: number }
```

### POST /projects/:id/services

```typescript
{ service_id: uuid, quantity: number, unit_price: number, description?: string }
```

### POST /payments

```typescript
{ project_id: uuid, amount: number, due_date: date, payment_method?: string, notes?: string }
```

### PUT /payments/:id/pay

```typescript
{ paid_date: date }
// status → 'paid', trigger cria financial_entry
```

### POST /fixed-costs

```typescript
{ name: string, amount: number, due_day: number, category?: string }
```

---

## PDF Generation — Decisão Pendente

Geração de PDF em Supabase Edge Functions (Deno) é limitada: Puppeteer não é compatível. Opções:

1. **jsPDF** — port Deno disponível; gera PDF programaticamente (sem HTML rendering). Suficiente para documentos com tabelas e texto.
2. **Função separada + renderização HTML** — Edge Function chama um serviço externo (ex: API de HTML-to-PDF). Requer dependência externa.
3. **Frontend-side PDF** — gera o PDF no browser com jsPDF/react-pdf. Mais simples de implementar inicialmente.

**Decisão inicial:** Frontend-side PDF (react-pdf ou jsPDF) para desbloquear M7. Migrar para server-side em M8 se necessário.

---

## Componentes UI Reutilizáveis (já existentes)

Os componentes `Button`, `Input`, `Modal`, `Select` já existem em `apps/web/src/presentation/components/ui/`. Novos componentes de lista e formulário devem seguir o mesmo padrão.
