# Manager Dashboard — Boilerplate

**Vision:** Boilerplate production-ready para gerenciamento interno com CRUD de serviços, CRUD de usuários e autenticação JWT — servindo como base reutilizável para novos projetos.
**For:** Desenvolvedores que precisam de um ponto de partida completo com Clean Architecture, monorepo e infraestrutura de deploy configurada.
**Solves:** Elimina o tempo gasto configurando arquitetura, autenticação, CI/CD e estrutura de projeto do zero a cada novo projeto.

## Goals

- Monorepo Turborepo funcional com apps `api` (NestJS) e `web` (Next.js) + pacotes compartilhados
- Clean Architecture implementada em ambos os apps (domínio isolado, casos de uso, infra separada)
- CRUD completo de Serviços e Usuários com autenticação JWT funcionando end-to-end
- Pipeline CI/CD automatizado (GitHub Actions) com deploy em Railway (api + postgres) e Vercel (web)

## Tech Stack

**Core:**
- Monorepo: Turborepo
- Language: TypeScript
- Package manager: npm workspaces

**Backend (apps/api):**
- Framework: NestJS ^11
- Database: PostgreSQL via TypeORM
- Auth: JWT (@nestjs/jwt + @nestjs/passport)
- Deploy: Railway

**Frontend (apps/web):**
- Framework: Next.js 15 (App Router)
- Styling: TailwindCSS v4
- State/Data: @tanstack/react-query v5
- Deploy: Vercel

**Shared:**
- packages/domain — tipos e interfaces compartilhadas
- packages/tsconfig — configuração TypeScript base

## Scope

**v1 inclui:**
- Configuração Turborepo (turbo.json, workspaces, scripts unificados)
- Pacote `packages/domain` com entidades compartilhadas (User, Service)
- Pacote `packages/tsconfig` com configs base
- Backend: Clean Architecture completa (domain, application, infrastructure layers)
- Backend: CRUD Users (criar, listar, buscar, atualizar, deletar)
- Backend: CRUD Services (migrado do DynamoDB para PostgreSQL)
- Backend: Auth com JWT (login, registro, refresh, guards)
- Backend: Migrations TypeORM + seeds
- Frontend: Next.js App Router com Clean Architecture
- Frontend: CRUD Services com auth
- Frontend: CRUD Users com auth
- Frontend: Páginas de Login e Registro
- CI/CD: GitHub Actions para api (Railway) e web (Vercel)

**Explicitamente fora de escopo:**
- Sistema de permissões/roles granular (RBAC) — complexidade extra para v1
- Upload de arquivos — requer infra adicional
- Notifications (email, push) — fora do core
- Multi-tenancy — não necessário no boilerplate
- packages/ui (design system) — opcional, não implementado em v1

## Constraints

- Timeline: boilerplate, sem prazo fixo
- Technical: Railway Postgres (sem infraestrutura AWS para banco)
- Migration: código existente de `servicos` deve ser preservado e migrado
