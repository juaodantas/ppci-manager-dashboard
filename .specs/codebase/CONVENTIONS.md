# Code Conventions

**Analyzed:** 2026-03-31

## Naming Conventions

**Arquivos:**
- Backend: `kebab-case` com sufixo de papel — `servicos.controller.ts`, `servicos.service.ts`, `servicos.repository.ts`, `dto.ts`
- Frontend: `PascalCase` para componentes React — `ServiceTable.tsx`, `Dashboard.tsx`; `camelCase` para hooks e serviços — `useServices.ts`, `serviceApi.ts`

**Classes/Interfaces:**
- PascalCase — `ServicosController`, `ServicosService`, `Servico`, `CreateServicoDto`

**Funções/Métodos:**
- camelCase — `findAll()`, `findOne()`, `create()`, `update()`, `remove()`

**Variáveis:**
- camelCase — `createServicoDto`, `updateServicoDto`, `tableName`

**Enums:**
- PascalCase com valores UPPER_SNAKE_CASE — `TipoServico.OBRA_INCENDIO`, `StatusServico.EM_ANDAMENTO`

**Constantes de ambiente:**
- UPPER_SNAKE_CASE — `DYNAMO_SERVICOS_TABLE_NAME`, `AWS_REGION`, `VITE_API_URL`

## Estrutura de Arquivos

**Backend — módulo NestJS:**
```
servicos/
├── dto/dto.ts                   ← DTOs agrupados num arquivo
├── entities/servico.entity.ts   ← interfaces/enums do domínio
├── servicos.controller.ts
├── servicos.module.ts
├── servicos.repository.ts
├── servicos.service.ts
└── servicos.controller.spec.ts
```

**Frontend — feature:**
```
hooks/useServices.ts
services/serviceApi.ts
components/ServiceTable.tsx
pages/Services.tsx
types/service.ts
```

## TypeScript

- Tipos explícitos nos parâmetros de função
- `interface` para formas de objetos
- `enum` para valores finitos
- `Partial<T>` para updates parciais
- Sem `any` aparente — tipos inferidos

## NestJS Decorators

- Controllers decorados com `@ApiTags`, `@ApiOperation`, `@ApiResponse` (Swagger)
- DTOs usam `class-validator` (`@IsString`, `@IsEnum`, etc.)
- Injeção via construtor: `constructor(private readonly servicosService: ServicosService)`

## Idioma

- Código em inglês (nomes de variáveis, funções, classes)
- Comentários e strings de usuário em português quando necessário
- Nomes de domínio em português quando representam conceitos do negócio (`servico`, `cliente`)

## Error Handling

- Backend: `try/catch` nos repositories com `logger.error` + re-throw
- Frontend: via React Query (error states) e interceptor Axios (401 redirect)
