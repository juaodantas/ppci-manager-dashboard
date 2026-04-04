# PPCI Manager Dashboard

**Vision:** Sistema de gestão interna para empresa de engenharia especializada em regularização de imóveis (PPCI/AVCB), controlando o ciclo completo — do orçamento ao recebimento — e o fluxo de caixa da empresa.

**For:** Engenheiros, secretárias, gestores e setor financeiro da empresa.

**Solves:** Falta de visibilidade sobre projetos em andamento, controle manual de pagamentos e orçamentos, e ausência de histórico centralizado de clientes e projetos.

## Goals

- Gerenciar o ciclo comercial completo: cliente → orçamento → projeto → pagamento
- Controlar fluxo de caixa: receitas por projeto + custos fixos mensais
- Gerar orçamentos e contratos em PDF sem ferramentas externas

## Tech Stack

**Core:**
- Monorepo: Turborepo + npm workspaces
- Language: TypeScript ~5.9 (frontend) / Deno TypeScript (backend)
- Database: PostgreSQL via Supabase

**Backend (supabase/functions/api):**
- Framework: Hono (edge-native, Deno-compatible)
- Runtime: Deno (Supabase Edge Functions)
- Database: SQL direto via postgresjs (sem ORM)
- Auth: JWT customizado HS256 + refresh_tokens (já implementado)

**Frontend (apps/web):**
- Framework: Next.js 15 (App Router)
- Styling: TailwindCSS v4
- State/Data: @tanstack/react-query v5
- HTTP: Axios + Zod validation

## Scope

**v1 inclui:**
- Gestão de clientes (CRUD + soft delete via deleted_at)
- Catálogo de tipos de serviço com histórico de preços (service_price)
- Orçamentos: criação com itens, aprovação, exportação PDF
- Projetos: criação direta ou via orçamento aprovado, serviços vinculados
- Pagamentos por projeto (vencimento, baixa, status overdue)
- Custos fixos mensais (cadastro + lançamento em financial_entries)
- Fluxo de caixa: receitas realizadas vs custos fixos por período
- Exportação de contrato PDF por projeto
- Autenticação JWT com refresh token (já implementado — preservado)

**Explicitamente fora de escopo (v1):**
- RBAC / controle de permissões por papel de usuário
- Upload e armazenamento de documentos/anexos
- Notificações automáticas (e-mail, push)
- App mobile
- Integração com sistemas externos (CBMMG, prefeituras)

## Constraints

- Auth system (JWT + refresh_tokens + users) já implementado — não refatorar
- RBAC é explicitamente ignorado nesta fase
- Monorepo Turborepo e CI/CD existentes devem ser mantidos
- Old `services` table (JSONB-based) será descartada e substituída pelo novo schema relacional
