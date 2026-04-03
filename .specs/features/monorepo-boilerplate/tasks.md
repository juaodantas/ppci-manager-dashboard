# Monorepo Boilerplate Tasks

**Design:** `.specs/features/monorepo-boilerplate/design.md`
**Status:** Done ✅ — Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Phase 4 ✅

**Completed:** T1 T2 T3 T4 T5 T6 T7 T8 T9 T10 T11 T12 T13 T14 T15 T16 T17 T18 T19 T20 T21 T22 T23 T24 T25 T26 T27 T28 T29 T30 T31 T32 T33 T34 T35 T36 T37 T38 T39 T40

---

## Execution Plan

```
Phase 1 — Monorepo Foundation (Sequential)
  T1 → T2 → T3 → T4

Phase 2 — Backend Core (Sequential dentro, paralelo entre sub-fases)
  T4 complete, then:
  T5 → T6 → T7 (domain + application layers)

  T7 complete, then (Parallel):
    ├── T8  [P] user ORM entity
    ├── T9  [P] service ORM entity
    └── T10 [P] TypeORM config + migration inicial

  T8 + T9 + T10 complete, then (Parallel):
    ├── T11 [P] user typeorm-repository
    └── T12 [P] service typeorm-repository

  T11 + T12 complete, then (Sequential):
  T13 → T14 → T15 → T16  (auth module)

  T13 complete, then (Parallel):
    ├── T17 [P] user module (controller + DTOs + module)
    └── T18 [P] service module (controller + DTOs + module)

  T17 + T18 complete:
  T19 (app.module.ts) → T20 (main.ts) → T21 (seed)

Phase 3 — Frontend Next.js (Parallel com Phase 2 após T4)
  T22 → T23 → T24 (foundation Next.js)

  T24 complete, then (Parallel):
    ├── T25 [P] domain layer frontend
    ├── T26 [P] auth port + token storage
    └── T27 [P] UI components migrados

  T25 + T26 complete, then (Parallel):
    ├── T28 [P] user use cases frontend
    ├── T29 [P] service use cases frontend
    └── T30 [P] auth use cases frontend

  T28 + T29 + T30 complete, then (Parallel):
    ├── T31 [P] HTTP repositories frontend
    └── T32 [P] DI container

  T31 + T32 + T27 complete, then (Sequential):
  T33 → T34 → T35 → T36 → T37

Phase 4 — CI/CD (após Phase 2 e Phase 3 funcionais)
  T38 [P] → T39 [P] → T40 [P]
```

---

## Phase 1 — Monorepo Foundation

### T1: Configurar root package.json com workspaces

**What:** Criar `package.json` na raiz com `workspaces`, scripts de dev/build/lint/test delegando ao Turborepo.
**Where:** `/package.json`
**Depends on:** None
**Reuses:** Nada (arquivo novo)
**Requirement:** MONO-01

**Done when:**
- [ ] `workspaces` aponta para `apps/*` e `packages/*`
- [ ] Scripts: `dev`, `build`, `lint`, `test` usando `turbo run`
- [ ] `turbo` como devDependency

**Verify:** `cat package.json | grep workspaces` mostra configuração correta.

---

### T2: Criar turbo.json com pipeline de tasks

**What:** Configurar `turbo.json` com pipelines para `build`, `dev`, `lint`, `test` com cache e dependências corretas.
**Where:** `/turbo.json`
**Depends on:** T1
**Reuses:** Nada
**Requirement:** MONO-01

**Done when:**
- [ ] Pipeline `build` com `dependsOn: ["^build"]`
- [ ] Pipeline `dev` com `cache: false`, `persistent: true`
- [ ] Pipeline `lint` e `test` configurados

**Verify:** `npx turbo build --dry` mostra tarefas detectadas.

---

### T3: Criar packages/tsconfig com configs base

**What:** Criar o package `packages/tsconfig` com `base.json`, `nestjs.json` e `nextjs.json`.
**Where:** `packages/tsconfig/`
**Depends on:** T1
**Reuses:** `manager-api/tsconfig.json` e `manager-front/tsconfig.json` como referência
**Requirement:** MONO-03

**Done when:**
- [ ] `packages/tsconfig/package.json` com `name: "@manager/tsconfig"`
- [ ] `base.json` com strict, paths, etc.
- [ ] `nestjs.json` estendendo base (decorators, emitDecoratorMetadata)
- [ ] `nextjs.json` estendendo base

**Verify:** `cat packages/tsconfig/base.json` mostra config válida.

---

### T4: Criar packages/domain com entidades compartilhadas

**What:** Criar o pacote `packages/domain` com tipos de User, Service e enums — sem dependências externas.
**Where:** `packages/domain/`
**Depends on:** T3
**Reuses:** `manager-api/src/servicos/entities/servico.entity.ts` (migrar interfaces/enums)
**Requirement:** MONO-02

**Done when:**
- [ ] `packages/domain/package.json` com `name: "@manager/domain"`
- [ ] `src/entities/user.entity.ts` — interface User
- [ ] `src/entities/service.entity.ts` — interface Service + enums migrados de servico.entity.ts
- [ ] `src/index.ts` exportando tudo
- [ ] `package.json` com `exports` apontando para `src/index.ts`

**Verify:** `node -e "require('./packages/domain/src/index.ts')"` sem erros (ou equivalente com tsx).

---

## Phase 2 — Backend Clean Architecture

### T5: Mover manager-api → apps/api e adaptar package.json

**What:** Mover o diretório `manager-api/` para `apps/api/`, adaptar `package.json` para workspace e remover dependências Serverless/AWS.
**Where:** `apps/api/`
**Depends on:** T4
**Reuses:** Todo o código existente de `manager-api/`
**Requirement:** MONO-01, SVC-01

**Done when:**
- [ ] Diretório `apps/api/` com código fonte de `manager-api/`
- [ ] `apps/api/package.json` com `name: "@manager/api"`
- [ ] Dependências AWS/Serverless removidas: `@aws-sdk/*`, `aws-sdk`, `@vendia/serverless-express`, `serverless`, `serverless-*`
- [ ] Dependências adicionadas: `typeorm`, `pg`, `@nestjs/typeorm`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`
- [ ] `tsconfig.json` extendendo `@manager/tsconfig/nestjs.json`

**Verify:** `ls apps/api/src` mostra estrutura anterior; `npm install` na raiz sem erros.

---

### T6: Criar estrutura de pastas Clean Architecture no backend

**What:** Criar os diretórios da Clean Architecture em `apps/api/src/`: `domain/`, `application/`, `infrastructure/`.
**Where:** `apps/api/src/`
**Depends on:** T5
**Reuses:** Estrutura definida no design.md

**Done when:**
- [ ] Diretórios criados: `domain/entities/`, `domain/repositories/`, `domain/exceptions/`
- [ ] Diretórios criados: `application/use-cases/user/`, `application/use-cases/service/`, `application/ports/`
- [ ] Diretórios criados: `infrastructure/database/typeorm/entities/`, `infrastructure/database/typeorm/repositories/`, `infrastructure/database/typeorm/migrations/`
- [ ] Diretórios criados: `infrastructure/modules/user/`, `infrastructure/modules/service/`, `infrastructure/modules/auth/`

**Verify:** `find apps/api/src -type d | sort` mostra estrutura completa.

---

### T7: Criar entidades de domínio puras (User + Service)

**What:** Criar `user.entity.ts` e `service.entity.ts` no domain layer — classes TypeScript puras, sem decorators NestJS/TypeORM.
**Where:** `apps/api/src/domain/entities/`
**Depends on:** T6
**Reuses:** `packages/domain` para tipos base; `servicos/entities/servico.entity.ts` para enums
**Requirement:** USER-01, SVC-01

**Done when:**
- [ ] `user.entity.ts` — classe `User` com campos id, name, email, passwordHash, createdAt, updatedAt + método `updateProfile()`
- [ ] `service.entity.ts` — classe `Service` com todos os campos do domínio migrados de servico.entity.ts
- [ ] `domain/exceptions/domain.exception.ts` — classe base `DomainException extends Error`
- [ ] Zero imports de `@nestjs/*` ou `typeorm` nestes arquivos
- [ ] Interfaces de repositório: `IUserRepository` e `IServiceRepository` em `domain/repositories/`

**Verify:** `grep -r "@nestjs\|typeorm" apps/api/src/domain/` retorna vazio.

---

### T8: Criar ORM entity para User [P]

**What:** Criar `user.orm-entity.ts` com decorators TypeORM — separada da entidade de domínio.
**Where:** `apps/api/src/infrastructure/database/typeorm/entities/user.orm-entity.ts`
**Depends on:** T7
**Reuses:** Estrutura do design.md (tabela users)
**Requirement:** USER-01

**Done when:**
- [ ] `@Entity('users')` com campos: id (uuid), name, email (unique), passwordHash, createdAt, updatedAt
- [ ] Decorators: `@PrimaryGeneratedColumn('uuid')`, `@Column`, `@CreateDateColumn`, `@UpdateDateColumn`

**Verify:** TypeScript compila sem erros.

---

### T9: Criar ORM entity para Service [P]

**What:** Criar `service.orm-entity.ts` com decorators TypeORM.
**Where:** `apps/api/src/infrastructure/database/typeorm/entities/service.orm-entity.ts`
**Depends on:** T7
**Reuses:** Campos de `servico.entity.ts` adaptados para TypeORM
**Requirement:** SVC-01

**Done when:**
- [ ] `@Entity('services')` com todos os campos do domínio de serviço
- [ ] Campos complexos (cronograma, pagamentos, documentos, etc.) como `@Column('jsonb', { nullable: true })`

**Verify:** TypeScript compila sem erros.

---

### T10: Configurar TypeORM + migration inicial [P]

**What:** Configurar `DataSource` TypeORM, criar migration inicial com tabelas `users` e `services`, e scripts de migration no `package.json`.
**Where:** `apps/api/src/infrastructure/database/typeorm/`, `apps/api/package.json`
**Depends on:** T8, T9
**Reuses:** Schemas definidos no design.md
**Requirement:** SVC-01

**Done when:**
- [ ] `data-source.ts` com `DataSource` configurado via env vars (`DATABASE_URL` ou variáveis individuais)
- [ ] Migration `[timestamp]-initial.ts` cria tabelas `users` e `services`
- [ ] Scripts no `package.json`: `migration:generate`, `migration:run`, `migration:revert`
- [ ] `.env.example` com `DATABASE_URL=postgresql://...`

**Verify:** `npm run migration:run` no `apps/api/` cria tabelas no PostgreSQL local.

---

### T11: Implementar UserTypeOrmRepository [P]

**What:** Implementar `IUserRepository` usando TypeORM `Repository<UserOrmEntity>`.
**Where:** `apps/api/src/infrastructure/database/typeorm/repositories/user.typeorm-repository.ts`
**Depends on:** T8, T7
**Reuses:** Padrão de repositório NestJS com `@InjectRepository`
**Requirement:** USER-01

**Done when:**
- [ ] Implementa `IUserRepository`: `findById`, `findByEmail`, `findAll`, `save`, `delete`
- [ ] Mapeia `UserOrmEntity` ↔ `User` (domínio) em métodos privados `toDomain()` e `toOrm()`
- [ ] `@Injectable()` e pronto para ser registrado no módulo

**Verify:** TypeScript compila; métodos assinam corretamente `IUserRepository`.

---

### T12: Implementar ServiceTypeOrmRepository [P]

**What:** Implementar `IServiceRepository` usando TypeORM `Repository<ServiceOrmEntity>`.
**Where:** `apps/api/src/infrastructure/database/typeorm/repositories/service.typeorm-repository.ts`
**Depends on:** T9, T7
**Reuses:** Mesmo padrão de T11
**Requirement:** SVC-01

**Done when:**
- [ ] Implementa `IServiceRepository`: `findAll`, `findById`, `findByStatus`, `findByClienteId`, `save`, `delete`, `count`
- [ ] Mapeia `ServiceOrmEntity` ↔ `Service` (domínio)
- [ ] `@Injectable()`

**Verify:** TypeScript compila; métodos assinam `IServiceRepository`.

---

### T13: Criar módulo e serviço de autenticação

**What:** Criar `auth.module.ts`, `auth.service.ts`, `jwt.strategy.ts` e `auth.guard.ts`.
**Where:** `apps/api/src/infrastructure/modules/auth/`
**Depends on:** T11 (UserRepository para validar credenciais)
**Reuses:** `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcryptjs`
**Requirement:** AUTH-01, AUTH-02, AUTH-03

**Done when:**
- [ ] `auth.service.ts` — métodos: `validateUser(email, password)`, `login(user)`, `hashPassword(password)`
- [ ] `jwt.strategy.ts` — `PassportStrategy(Strategy)` extrai `sub` e `email` do token
- [ ] `auth.guard.ts` — `@Injectable() JwtAuthGuard extends AuthGuard('jwt')`
- [ ] `auth.module.ts` — importa `JwtModule.register({secret, signOptions})`, `PassportModule`, registra `AuthService`, `JwtStrategy`
- [ ] `IAuthPort` em `application/ports/auth.port.ts` implementado por `AuthService`

**Verify:** Módulo compila; `AuthService.hashPassword('test')` retorna hash bcrypt.

---

### T14: Criar controller de autenticação

**What:** Criar `auth.controller.ts` com endpoints `POST /auth/login` e `POST /auth/register`.
**Where:** `apps/api/src/infrastructure/modules/auth/auth.controller.ts`
**Depends on:** T13
**Reuses:** `AuthService`; padrão de controller NestJS com Swagger
**Requirement:** AUTH-01, AUTH-02

**Done when:**
- [ ] `POST /auth/register` — cria user (via CreateUserUseCase) e retorna `{ access_token }`
- [ ] `POST /auth/login` — valida credenciais e retorna `{ access_token }`
- [ ] DTOs com class-validator: `LoginDto`, `RegisterDto`
- [ ] Decorators Swagger: `@ApiTags('auth')`, `@ApiOperation`, `@ApiResponse`
- [ ] Endpoints de auth são públicos (sem guard)

**Verify:** `curl POST /auth/register` com dados válidos retorna `{ access_token: "..." }`.

---

### T15: Criar use cases de User

**What:** Criar os 4 use cases de User: `CreateUserUseCase`, `GetUserUseCase`, `UpdateUserUseCase`, `DeleteUserUseCase`.
**Where:** `apps/api/src/application/use-cases/user/`
**Depends on:** T7 (entidade + IUserRepository), T13 (IAuthPort para hashPassword)
**Reuses:** Token simbólico `USER_REPOSITORY`, `AUTH_PORT`
**Requirement:** USER-01

**Done when:**
- [ ] `create-user.use-case.ts` — verifica email único, hash senha, salva, retorna User (sem passwordHash)
- [ ] `get-user.use-case.ts` — `getAll()` e `getById(id)` com 404 se não encontrado
- [ ] `update-user.use-case.ts` — atualiza name (e senha se fornecida)
- [ ] `delete-user.use-case.ts` — deleta por id, 404 se não encontrado
- [ ] Sem decorators NestJS na lógica principal (apenas `@Inject` no construtor)

**Verify:** TypeScript compila; zero imports `@nestjs/common` exceto `@Inject` e exceptions.

---

### T16: Criar use cases de Service

**What:** Criar os 4 use cases de Service: `CreateServiceUseCase`, `GetServiceUseCase`, `UpdateServiceUseCase`, `DeleteServiceUseCase`.
**Where:** `apps/api/src/application/use-cases/service/`
**Depends on:** T7, T12
**Reuses:** Token simbólico `SERVICE_REPOSITORY`; lógica migrada de `servicos.service.ts`
**Requirement:** SVC-01

**Done when:**
- [ ] Use cases implementados com mesma lógica de `ServicosService` atual
- [ ] `getStats()` migrado para `GetServiceStatsUseCase`
- [ ] Filtros por status e clienteId preservados

**Verify:** TypeScript compila; lógica equivalente ao `servicos.service.ts` original.

---

### T17: Criar módulo de User (NestJS) [P]

**What:** Criar `user.module.ts`, `user.controller.ts`, `user.dto.ts` para o módulo de usuários.
**Where:** `apps/api/src/infrastructure/modules/user/`
**Depends on:** T15 (use cases), T11 (repository)
**Reuses:** Padrão de controller com Swagger do `servicos.controller.ts`
**Requirement:** USER-01

**Done when:**
- [ ] `user.dto.ts` — `CreateUserDto`, `UpdateUserDto` com class-validator
- [ ] `user.controller.ts` — CRUD completo com `@UseGuards(JwtAuthGuard)` em todos os endpoints
- [ ] `user.module.ts` — registra `{ provide: USER_REPOSITORY, useClass: UserTypeOrmRepository }` + use cases
- [ ] Resposta de user NUNCA inclui `passwordHash`

**Verify:** Endpoints em `/api-docs`; GET `/users` sem token retorna 401.

---

### T18: Criar módulo de Service (NestJS) [P]

**What:** Criar `service.module.ts`, `service.controller.ts`, `service.dto.ts` — migrando de `servicos/`.
**Where:** `apps/api/src/infrastructure/modules/service/`
**Depends on:** T16 (use cases), T12 (repository)
**Reuses:** `servicos.controller.ts` e `servicos/dto/dto.ts` como base de migração
**Requirement:** SVC-01

**Done when:**
- [ ] DTOs migrados e separados em arquivos individuais: `create-service.dto.ts`, `update-service.dto.ts`
- [ ] Controller com CRUD completo + `@UseGuards(JwtAuthGuard)`
- [ ] Endpoint `GET /services/stats` preservado
- [ ] `service.module.ts` com providers corretos

**Verify:** Swagger mostra endpoints /services; funciona com Bearer token.

---

### T19: Atualizar app.module.ts

**What:** Atualizar `app.module.ts` para importar TypeOrmModule (com DataSource), AuthModule, UserModule, ServiceModule.
**Where:** `apps/api/src/app.module.ts`
**Depends on:** T10, T13, T17, T18
**Reuses:** `app.module.ts` existente

**Done when:**
- [ ] `TypeOrmModule.forRoot()` com configuração via env vars
- [ ] `AuthModule`, `UserModule`, `ServiceModule` importados
- [ ] `AppModule` remove referências ao `ServicosModule` antigo
- [ ] `ValidationPipe` global com `whitelist: true`, `forbidNonWhitelisted: true`

**Verify:** `npm run start:dev` inicia sem erros; Swagger disponível em `/api-docs`.

---

### T20: Refatorar main.ts (remover Lambda, adicionar bootstrap local)

**What:** Refatorar `main.ts` para bootstrap NestJS padrão com `app.listen()`. Remover handler Lambda.
**Where:** `apps/api/src/main.ts`
**Depends on:** T19
**Reuses:** Configuração Swagger existente
**Requirement:** MONO-01 (resolve concern C02)

**Done when:**
- [ ] `main.ts` usa `NestFactory.create()` + `app.listen(port)` padrão
- [ ] Swagger configurado (preservado)
- [ ] CORS habilitado com origins configuráveis via env
- [ ] `lambda.ts` removido (ou movido para arquivo separado se Railway não precisar)
- [ ] Porta configurável via `PORT` env var

**Verify:** `npm run start:dev` em `apps/api/` inicia na porta 3001; `/api-docs` acessível no browser.

---

### T21: Criar seed de dados

**What:** Criar script de seed que popula banco com usuário admin e serviços de exemplo.
**Where:** `apps/api/src/infrastructure/database/typeorm/seeds/`
**Depends on:** T20 (app funcionando), T10 (migrations rodadas)
**Reuses:** Use cases de criação
**Requirement:** SVC-01

**Done when:**
- [ ] Script `seed.ts` cria: 1 user admin (admin@example.com / admin123)
- [ ] Script cria: 3 serviços de exemplo com tipos diferentes
- [ ] Script script `npm run seed` definido no `package.json`
- [ ] Script é idempotente (não duplica dados se rodar duas vezes)

**Verify:** `npm run seed` sem erros; `GET /services` retorna 3 serviços após seed.

---

## Phase 3 — Frontend Next.js

### T22: Criar app Next.js em apps/web

**What:** Criar novo app Next.js 15 com App Router em `apps/web/`, configurado para o workspace.
**Where:** `apps/web/`
**Depends on:** T4 (packages prontos)
**Reuses:** Configuração Tailwind de `manager-front/`

**Done when:**
- [ ] `apps/web/package.json` com `name: "@manager/web"`
- [ ] Next.js 15, TailwindCSS v4, TypeScript configurados
- [ ] `tsconfig.json` estendendo `@manager/tsconfig/nextjs.json`
- [ ] `apps/web/` dependendo de `@manager/domain`
- [ ] `npm run dev` na raiz inicia o web na porta 3000

**Verify:** `npm run dev` abre `http://localhost:3000` com página Next.js.

---

### T23: Criar estrutura de pastas Clean Architecture no frontend

**What:** Criar os diretórios da Clean Architecture em `apps/web/src/`.
**Where:** `apps/web/src/`
**Depends on:** T22

**Done when:**
- [ ] `domain/entities/`, `domain/repositories/`, `domain/value-objects/`
- [ ] `application/use-cases/user/`, `application/use-cases/auth/`, `application/ports/`
- [ ] `infrastructure/http/`, `infrastructure/storage/`, `infrastructure/di/`
- [ ] `presentation/components/ui/`, `presentation/components/shared/`, `presentation/hooks/`, `presentation/contexts/`
- [ ] `presentation/app/(auth)/login/`, `(auth)/register/`, `(dashboard)/`

**Verify:** `find apps/web/src -type d | sort` mostra estrutura completa.

---

### T24: Migrar componentes UI para apps/web

**What:** Migrar `Button`, `Input`, `Modal`, `Select`, `Layout`, `ServiceTable`, `ServiceForm`, `ServiceFilters`, `DashboardStats` de `manager-front/` para `apps/web/`.
**Where:** `apps/web/src/presentation/components/`
**Depends on:** T23
**Reuses:** Todos os componentes de `manager-front/src/components/`

**Done when:**
- [ ] Componentes `ui/` migrados com adaptações para Next.js (remoção de imports Vite-specific)
- [ ] Componentes `shared/` migrados
- [ ] TailwindCSS classes preservadas
- [ ] Componentes compilam sem erros TypeScript

**Verify:** TypeScript compila sem erros nos componentes migrados.

---

### T25: Criar domain layer do frontend [P]

**What:** Criar entidades, interfaces de repositório e value objects no domain layer do frontend.
**Where:** `apps/web/src/domain/`
**Depends on:** T23
**Reuses:** `@manager/domain` para tipos base
**Requirement:** AUTH-04, USER-02, SVC-02

**Done when:**
- [ ] `entities/user.entity.ts` e `service.entity.ts` (re-exportam ou estendem `@manager/domain`)
- [ ] `repositories/user.repository.ts` — interface `IUserRepository` com métodos CRUD + login
- [ ] `repositories/service.repository.ts` — interface `IServiceRepository`
- [ ] `value-objects/email.vo.ts` — classe `Email` com validação no construtor

**Verify:** Zero imports de React, fetch ou axios neste diretório.

---

### T26: Criar auth token port e implementação localStorage [P]

**What:** Criar `IAuthTokenPort` (interface) e `LocalStorageToken` (implementação).
**Where:** `apps/web/src/application/ports/auth-token.port.ts` e `apps/web/src/infrastructure/storage/`
**Depends on:** T23
**Requirement:** AUTH-04, AUTH-05

**Done when:**
- [ ] `IAuthTokenPort` com métodos: `getToken(): string | null`, `setToken(token: string): void`, `clear(): void`
- [ ] `LocalStorageToken` implementa `IAuthTokenPort` usando `localStorage`
- [ ] Guarda em `localStorage.setItem('token', value)`

**Verify:** TypeScript compila; interface implementada corretamente.

---

### T27: Migrar componentes UI genéricos e adaptar para Next.js [P]

**What:** Garantir que todos os componentes de `apps/web/src/presentation/components/ui/` usam padrões Next.js (sem `window` no SSR, `'use client'` onde necessário).
**Where:** `apps/web/src/presentation/components/ui/`
**Depends on:** T24
**Reuses:** Componentes migrados em T24

**Done when:**
- [ ] Diretiva `'use client'` adicionada nos componentes com interatividade (Modal, Form, etc.)
- [ ] Sem referências a `window` fora de `useEffect` ou client components
- [ ] Componentes puramente visuais sem `'use client'` desnecessário

**Verify:** `npm run build` em `apps/web/` sem erros de SSR.

---

### T28: Criar use cases de User (frontend) [P]

**What:** Criar `CreateUserUseCase`, `GetUsersUseCase`, `DeleteUserUseCase` no application layer.
**Where:** `apps/web/src/application/use-cases/user/`
**Depends on:** T25 (IUserRepository)
**Requirement:** USER-02

**Done when:**
- [ ] Use cases recebem `IUserRepository` via construtor (sem React)
- [ ] `GetUsersUseCase.execute()` retorna `User[]`
- [ ] `CreateUserUseCase.execute(dto)` retorna `User`
- [ ] `DeleteUserUseCase.execute(id)` retorna `void`

**Verify:** Zero imports React neste diretório.

---

### T29: Criar use cases de Service (frontend) [P]

**What:** Criar use cases de Service no application layer do frontend.
**Where:** `apps/web/src/application/use-cases/service/`
**Depends on:** T25
**Requirement:** SVC-02

**Done when:**
- [ ] Use cases equivalentes aos hooks atuais de `manager-front/src/hooks/useServices.ts`
- [ ] `GetServicesUseCase`, `CreateServiceUseCase`, `UpdateServiceUseCase`, `DeleteServiceUseCase`

**Verify:** Zero imports React neste diretório.

---

### T30: Criar use cases de Auth (frontend) [P]

**What:** Criar `LoginUseCase` e `LogoutUseCase`.
**Where:** `apps/web/src/application/use-cases/auth/`
**Depends on:** T25, T26
**Requirement:** AUTH-04

**Done when:**
- [ ] `LoginUseCase.execute({email, password})` chama repositório, salva token via `IAuthTokenPort`
- [ ] `LogoutUseCase.execute()` chama `IAuthTokenPort.clear()`

**Verify:** TypeScript compila; zero imports React.

---

### T31: Criar HTTP repositories do frontend [P]

**What:** Implementar `UserHttpRepository`, `ServiceHttpRepository`, `AuthHttpRepository` usando Axios.
**Where:** `apps/web/src/infrastructure/http/`
**Depends on:** T25, T26
**Reuses:** Lógica de `manager-front/src/services/serviceApi.ts` e `serviceApi.ts`
**Requirement:** USER-02, SVC-02, AUTH-04

**Done when:**
- [ ] `UserHttpRepository` implementa `IUserRepository` com Axios
- [ ] `ServiceHttpRepository` implementa `IServiceRepository` com Axios
- [ ] `AuthHttpRepository` tem método `login(email, password)` retornando token
- [ ] Cada repositório recebe `IAuthTokenPort` no construtor para adicionar Bearer header

**Verify:** TypeScript compila; métodos assinam interfaces de repositório.

---

### T32: Criar DI container do frontend [P]

**What:** Criar `container.ts` que instancia todos os repositórios e use cases com suas dependências.
**Where:** `apps/web/src/infrastructure/di/container.ts`
**Depends on:** T28, T29, T30, T31
**Reuses:** Padrão de factory functions

**Done when:**
- [ ] `tokenStorage = new LocalStorageToken()`
- [ ] Todos os repositories instanciados com `tokenStorage`
- [ ] Todos os use cases instanciados com os repositories corretos
- [ ] Exporta instâncias prontas para uso nos hooks

**Verify:** TypeScript compila sem erros circulares.

---

### T33: Criar Auth Context e middleware de rota

**What:** Criar `auth.context.tsx` e `middleware.ts` para proteção de rotas no Next.js.
**Where:** `apps/web/src/presentation/contexts/auth.context.tsx`, `apps/web/src/middleware.ts`
**Depends on:** T30, T32
**Requirement:** AUTH-05

**Done when:**
- [ ] `AuthContext` provê `user`, `isAuthenticated`, `login()`, `logout()`
- [ ] `middleware.ts` redireciona `/login` para dashboard se autenticado, e dashboard para `/login` se não autenticado
- [ ] `RootLayout` envolto com `AuthProvider`

**Verify:** Acessar `/services` sem token redireciona para `/login`.

---

### T34: Criar páginas de Login e Registro

**What:** Criar `app/(auth)/login/page.tsx` e `app/(auth)/register/page.tsx`.
**Where:** `apps/web/src/presentation/app/(auth)/`
**Depends on:** T33, T27 (componentes UI)
**Requirement:** AUTH-04

**Done when:**
- [ ] Formulário de login com email e senha; submit chama `useLogin` hook
- [ ] Formulário de registro com name, email, senha; submit chama `useRegister` hook
- [ ] `useLogin.ts` e `useRegister.ts` em `presentation/hooks/`
- [ ] Redireciona para dashboard após sucesso
- [ ] Exibe mensagem de erro em falha

**Verify:** Login com credenciais do seed redireciona para dashboard.

---

### T35: Criar página e hooks de Services

**What:** Criar `app/(dashboard)/services/page.tsx` com CRUD completo de serviços.
**Where:** `apps/web/src/presentation/app/(dashboard)/services/`
**Depends on:** T29, T32, T27 (ServiceTable, ServiceForm migrados)
**Requirement:** SVC-02

**Done when:**
- [ ] Página lista serviços com `ServiceTable`
- [ ] Botão "Novo Serviço" abre `ServiceForm` em modal
- [ ] Editar e deletar funcionais
- [ ] `useServices.ts` hook em `presentation/hooks/` usa use cases via container
- [ ] React Query para cache e loading states

**Verify:** CRUD completo de serviços funciona no browser.

---

### T36: Criar página e hooks de Users

**What:** Criar `app/(dashboard)/users/page.tsx` com CRUD completo de usuários.
**Where:** `apps/web/src/presentation/app/(dashboard)/users/`
**Depends on:** T28, T32
**Requirement:** USER-02

**Done when:**
- [ ] Página lista usuários em tabela
- [ ] CRUD funcional (create, edit, delete)
- [ ] `useUsers.ts` hook em `presentation/hooks/`
- [ ] React Query para estados

**Verify:** CRUD completo de usuários funciona no browser.

---

### T37: Criar Dashboard page e validar fluxo completo

**What:** Criar `app/(dashboard)/page.tsx` com stats e migrar `DashboardStats` component.
**Where:** `apps/web/src/presentation/app/(dashboard)/`
**Depends on:** T35, T36, T33
**Requirement:** MONO-01 (integração completa)

**Done when:**
- [ ] Dashboard mostra stats (total de serviços, por status)
- [ ] Layout autenticado com sidebar/header funcionando
- [ ] Fluxo completo: login → dashboard → services → logout

**Verify:** Fluxo completo funciona end-to-end com API rodando.

---

## Phase 4 — CI/CD

### T38: Criar workflow de CI [P]

**What:** Criar `.github/workflows/ci.yml` que roda lint, type-check e build em PRs e pushes.
**Where:** `.github/workflows/ci.yml`
**Depends on:** T20, T37
**Requirement:** INFRA-01

**Done when:**
- [ ] Trigger: `push` e `pull_request` em todas as branches
- [ ] Job `ci` roda: `npm ci` → `turbo lint` → `turbo build`
- [ ] Usa cache de node_modules e Turborepo remote cache (se configurado)
- [ ] Falha bloqueia merge via branch protection

**Verify:** PR aberto dispara o workflow; falha em lint/build bloqueia.

---

### T39: Criar workflow de deploy API (Railway) [P]

**What:** Criar `.github/workflows/deploy-api.yml` que faz deploy da API no Railway ao fazer push em main.
**Where:** `.github/workflows/deploy-api.yml`
**Depends on:** T38
**Requirement:** INFRA-02

**Done when:**
- [ ] Trigger: `push` em `main`
- [ ] Job instala Railway CLI e executa deploy
- [ ] Pós-deploy executa `npm run migration:run` via Railway
- [ ] Usa secrets: `RAILWAY_TOKEN`, `DATABASE_URL`

**Verify:** Push para main → deploy visível no dashboard Railway → `/api-docs` acessível.

---

### T40: Criar workflow de deploy Web (Vercel) [P]

**What:** Criar `.github/workflows/deploy-web.yml` que faz deploy do web na Vercel ao fazer push em main.
**Where:** `.github/workflows/deploy-web.yml`
**Depends on:** T38
**Requirement:** INFRA-03

**Done when:**
- [ ] Trigger: `push` em `main`
- [ ] Job instala Vercel CLI e executa `vercel --prod`
- [ ] Usa secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Preview deploys em PRs (opcional)

**Verify:** Push para main → deploy visível no dashboard Vercel → app acessível na URL Vercel.

---

## Parallel Execution Map

```
Phase 1 (Sequential — todos dependem um do outro):
  T1 ──→ T2 ──→ T3 ──→ T4

Phase 2 (Sequential start, depois paralelo):
  T4 ──→ T5 ──→ T6 ──→ T7

  T7 complete:
    ├── T8  [P] ─┐
    ├── T9  [P] ─┼──→ T10 [P]
    └── (T7)   ──┘

  T8 + T9 + T10 complete:
    ├── T11 [P] ─┐
    └── T12 [P] ─┘

  T11 + T12 complete:
  T13 ──→ T14 ──→ T15 ──→ T16

  T13 complete (parallel):
    ├── T17 [P] ─┐
    └── T18 [P] ─┘

  T17 + T18 complete:
  T19 ──→ T20 ──→ T21

Phase 3 (pode iniciar após T4, paralelo com Phase 2):
  T22 ──→ T23 ──→ T24

  T24 complete (parallel):
    ├── T25 [P] ─┐
    ├── T26 [P] ─┤
    └── T27 [P] ─┘

  T25 + T26 complete (parallel):
    ├── T28 [P] ─┐
    ├── T29 [P] ─┤
    └── T30 [P] ─┘

  T28 + T29 + T30 complete (parallel):
    ├── T31 [P] ─┐
    └── T32 [P] ─┘

  T31 + T32 + T27 complete:
  T33 ──→ T34 ──→ T35 ──→ T36 ──→ T37

Phase 4 (após Phase 2 e Phase 3 completos):
  T38 complete:
    ├── T39 [P]
    └── T40 [P]
```

---

## Task Granularity Check

| Task | Scope             | Status      |
|------|-------------------|-------------|
| T1   | 1 arquivo         | ✅ Granular |
| T7   | 3 arquivos (domain layer — coesos) | ✅ OK |
| T13  | 4 arquivos (módulo auth — coesos)  | ✅ OK |
| T17  | 3 arquivos (módulo user — coesos)  | ✅ OK |

Total: 40 tasks | Estimativa de execução: 4 fases bem definidas
