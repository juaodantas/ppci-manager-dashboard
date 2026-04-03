# Testing Infrastructure

**Analyzed:** 2026-03-31

## Test Frameworks

**Unit/Integration (backend):** Jest ^30 + @nestjs/testing
**E2E (backend):** Jest e2e (`test/jest-e2e.json`)
**Unit (frontend):** Não configurado (apenas devDependencies padrão sem jest/vitest)
**Coverage:** jest --coverage disponível no backend

## Test Organization

**Backend:**
- Localização: co-located — `*.spec.ts` ao lado dos arquivos fonte
- E2E: `test/` na raiz do projeto
- Naming: `[nome].controller.spec.ts`, `[nome].service.spec.ts`
- Arquivos existentes: `app.controller.spec.ts`, `servicos.controller.spec.ts`, `servicos.service.spec.ts`

**Frontend:**
- Sem estrutura de testes configurada

## Testing Patterns

### Unit Tests (backend)

**Abordagem:** `@nestjs/testing` com `Test.createTestingModule()`
**Localização:** co-located com source

### E2E Tests (backend)

**Abordagem:** Supertest + Jest
**Localização:** `test/app.e2e-spec.ts`
**Config:** `test/jest-e2e.json`

## Test Execution

**Backend:**
```bash
npm test              # unit
npm run test:cov      # com coverage
npm run test:e2e      # e2e
npm run test:watch    # watch mode
```

**Frontend:** Sem script de test configurado

## Coverage Targets

- Atual: não configurado/medido
- Metas: não documentadas
- Enforcement: não automatizado

## Estado Atual

- Spec files existem mas podem estar desatualizados (app gerado pelo CLI do NestJS)
- Frontend sem cobertura de testes
- Sem CI para executar testes automaticamente
