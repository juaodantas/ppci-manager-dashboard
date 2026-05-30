Agent: architect
Rules: AGENTS.md

# Tasks: Gráficos financeiros agregados para todas as empresas

## Contexto

A feature especificada em `.specs/features/financial-analytics-all-companies/spec.md` permite que os gráficos financeiros sejam exibidos quando a opção "Todas as empresas" estiver selecionada. Hoje o fluxo de analytics exige `company_id` em contratos web, hook, API e repositório SQL. A decisão do usuário para o modo sem `company_id` é somar tudo registrado no sistema, incluindo custos gerais com `company_id null`.

## Goals

- Criar um plano de execução atômico, verificável e rastreável aos requisitos `REQ-FAAC-*`.
- Explicitar dependências bloqueantes e tarefas paralelizáveis.
- Guiar implementação em estágios: contratos → backend → frontend → testes → validação.
- Preservar o escopo arquitetural definido na spec.

## Non-goals

- Implementar código de aplicação neste arquivo.
- Alterar `FinancialGraphs`.
- Alterar endpoints financeiros que não sejam `/financial/analytics`.
- Criar novos gráficos, métricas, filtros ou layout visual.
- Resolver de forma definitiva políticas globais de autorização fora do fluxo de analytics.

## Restrições arquiteturais obrigatórias

- Não alterar `FinancialGraphs`; ele deve continuar recebendo dados prontos e não conhecer `company_id`.
- Não expandir demais `apps/web/src/app/(dashboard)/financial/page.tsx`; se a mudança crescer, extrair regra pura ou reutilizar abstração existente.
- Não acoplar UI a SQL, schemas da API ou detalhes internos de serialização HTTP.
- Tornar `company_id` opcional apenas no fluxo de analytics.
- Não alterar o comportamento de entradas, relatórios ou outros endpoints financeiros.
- Manter validação de UUID quando `company_id` for enviado.
- Manter autorização por empresa específica via `isCompanyInScope(payload, company_id)` quando `company_id` existir.
- Atenção especial: em `/financial/analytics` sem `company_id`, a decisão do usuário é somar tudo registrado no sistema. Isso tem risco de segurança se JWT/usuário tiver escopo restritivo. A implementação deve registrar/verificar explicitamente que o endpoint agregado é permitido para o contexto atual ou bloquear antes de liberar.

## Data structures e interfaces envolvidas

- `FinancialAnalyticsQuery` ou schema equivalente em `supabase/functions/api/validation/schemas.ts`:
  - `company_id?: uuid` somente para analytics.
  - demais filtros existentes permanecem inalterados.
- Contratos web:
  - `apps/web/src/domain/repositories/financial.repository.ts`
  - `apps/web/src/application/use-cases/financial/financial.use-cases.ts`
  - `apps/web/src/infrastructure/http/financial.http-repository.ts`
- Hook e página:
  - `apps/web/src/presentation/hooks/useFinancial.ts`
  - `apps/web/src/app/(dashboard)/financial/page.tsx`
- API e persistência:
  - `supabase/functions/api/validation/schemas.ts`
  - `supabase/functions/api/routes/financial.ts`
  - `supabase/functions/api/repositories/financial.repository.ts`
- Testes relacionados:
  - `apps/web/src/__tests__/financial-analytics-rules.test.ts`

## Plano de execução DAG / staged

```text
Stage 1: contratos
  T01 ─┬─> T02
       └─> T03

Stage 2: backend
  T02 ─> T04 ─> T05 ─> T06

Stage 3: frontend
  T03 ─> T07 ─> T08

Stage 4: testes
  T04/T05/T07/T08 ─> T09 ─> T10 ─> T11

Stage 5: validação
  T06/T09/T10/T11 ─> T12
```

- Paralelizável: `T02` e `T03` após `T01`; `T04` e `T07` após seus contratos; `T09` e `T10` após implementação correspondente.
- Não paralelizável: `T05` depende de `T04`; `T06` depende de `T05`; `T08` depende de `T07`; `T12` depende de todos os testes e verificações anteriores.

## Tasks atômicas

### T01 — Confirmar boundary do contrato de analytics

- **Requisitos rastreados**: `REQ-FAAC-006`, `REQ-FAAC-007`
- **Objetivo**: identificar todos os tipos, schemas e métodos que representam analytics e confirmar que a opcionalidade de `company_id` ficará restrita a esse fluxo.
- **Dependências bloqueantes**: nenhuma.
- **Pode rodar em paralelo**: não; task inicial de orientação.
- **Arquivos permitidos**:
  - `apps/web/src/domain/repositories/financial.repository.ts`
  - `apps/web/src/application/use-cases/financial/financial.use-cases.ts`
  - `apps/web/src/infrastructure/http/financial.http-repository.ts`
  - `supabase/functions/api/validation/schemas.ts`
  - `supabase/functions/api/routes/financial.ts`
- **Arquivos proibidos quando aplicável**:
  - `FinancialGraphs` e seus arquivos relacionados.
  - Endpoints financeiros não relacionados a analytics.
- **Critérios de verificação**:
  - Lista de pontos de contrato identificada antes das alterações.
  - Nenhum contrato de entries/report tornado opcional por engano.
- **Comando de validação**: não aplicável; verificação por leitura/diff.

### T02 — Atualizar contratos TypeScript web de analytics

- **Requisitos rastreados**: `REQ-FAAC-005`, `REQ-FAAC-006`
- **Objetivo**: permitir que domínio, use case e repositório HTTP aceitem analytics sem `company_id`, mantendo `company_id` obrigatório nos demais fluxos.
- **Dependências bloqueantes**: `T01`.
- **Pode rodar em paralelo**: sim, com `T03`; não depende do backend implementado.
- **Arquivos permitidos**:
  - `apps/web/src/domain/repositories/financial.repository.ts`
  - `apps/web/src/application/use-cases/financial/financial.use-cases.ts`
  - `apps/web/src/infrastructure/http/financial.http-repository.ts`
- **Arquivos proibidos quando aplicável**:
  - `apps/web/src/app/(dashboard)/financial/page.tsx`
  - `supabase/functions/api/**`
- **Critérios de verificação**:
  - Entrada de analytics aceita ausência de `company_id`.
  - Chamadas com empresa específica continuam aceitando `company_id` válido.
  - Nenhum tipo usa `any`, `@ts-ignore`, `as unknown` ou double cast.
- **Comando de validação**: comando de typecheck existente do projeto, após identificar em `package.json`.

### T03 — Atualizar schema de validação da API para company_id opcional em analytics

- **Requisitos rastreados**: `REQ-FAAC-001`, `REQ-FAAC-007`
- **Objetivo**: permitir `/financial/analytics` sem `company_id` e continuar rejeitando `company_id` inválido quando enviado.
- **Dependências bloqueantes**: `T01`.
- **Pode rodar em paralelo**: sim, com `T02`.
- **Arquivos permitidos**:
  - `supabase/functions/api/validation/schemas.ts`
- **Arquivos proibidos quando aplicável**:
  - Schemas de entries/report se não forem reutilizados exclusivamente por analytics.
- **Critérios de verificação**:
  - Payload/query sem `company_id` passa validação para analytics.
  - Payload/query com UUID válido continua passando.
  - Payload/query com `company_id` inválido continua falhando.
- **Comando de validação**: testes de schema/API existentes, se houver; caso contrário validar via teste unitário relacionado em `T10`.

### T04 — Ajustar rota `/financial/analytics` para autorização condicional

- **Requisitos rastreados**: `REQ-FAAC-007`, `REQ-FAAC-008`, `REQ-FAAC-009`
- **Objetivo**: manter `isCompanyInScope(payload, company_id)` quando `company_id` for informado e tratar explicitamente o modo agregado sem `company_id` conforme decisão de somar tudo registrado no sistema.
- **Dependências bloqueantes**: `T03`.
- **Pode rodar em paralelo**: sim, com `T07` após contratos correspondentes; não pode rodar antes do schema.
- **Arquivos permitidos**:
  - `supabase/functions/api/routes/financial.ts`
- **Arquivos proibidos quando aplicável**:
  - Repositório SQL, exceto em `T05`.
  - Outros endpoints financeiros.
- **Critérios de verificação**:
  - Com `company_id`, rota continua chamando/verificando `isCompanyInScope(payload, company_id)`.
  - Sem `company_id`, rota não tenta validar escopo de empresa com string vazia/undefined como UUID.
  - Risco de segurança documentado no diff ou em nota de implementação: analytics agregado sem `company_id` soma tudo do sistema e deve ser permitido apenas se esse for o contrato esperado para o usuário/JWT.
  - Se o código já tiver mecanismo de permissão global, ele deve ser usado; se não houver, a ausência deve ser destacada para revisão antes do merge.
- **Comando de validação**: testes de rota/API existentes, se houver; caso contrário cobrir em `T10` ou validação manual documentada.

### T05 — Ajustar repositório SQL de analytics para agregação sem filtro de empresa

- **Requisitos rastreados**: `REQ-FAAC-001`, `REQ-FAAC-002`, `REQ-FAAC-003`
- **Objetivo**: quando `company_id` estiver ausente, remover o filtro por empresa e agregar todos os registros, incluindo `company_id null`; quando presente, manter filtro por igualdade.
- **Dependências bloqueantes**: `T04`.
- **Pode rodar em paralelo**: não; depende da decisão/rota de autorização e contrato de schema.
- **Arquivos permitidos**:
  - `supabase/functions/api/repositories/financial.repository.ts`
- **Arquivos proibidos quando aplicável**:
  - UI e hooks web.
  - Queries de report/entries, salvo se forem helpers compartilhados estritamente necessários e sem mudança de comportamento.
- **Critérios de verificação**:
  - `company_id` presente aplica filtro exclusivo por empresa.
  - `company_id` ausente não aplica filtro que exclua empresas nem `company_id null`.
  - Query não concatena SQL com input externo de forma insegura.
  - Tratamento de erro permanece explícito e tipado conforme padrão existente.
- **Comando de validação**: teste de repositório/API existente, se disponível; caso contrário validação direcionada com fixtures/mocks já existentes.

### T06 — Revisar segurança do modo agregado sem company_id

- **Requisitos rastreados**: `REQ-FAAC-008`, `REQ-FAAC-009`
- **Objetivo**: verificar e registrar a implicação de autorização para `/financial/analytics` sem `company_id`, considerando que a decisão funcional é somar tudo registrado no sistema.
- **Dependências bloqueantes**: `T04`, `T05`.
- **Pode rodar em paralelo**: não; depende do fluxo backend estar desenhado/implementado.
- **Arquivos permitidos**:
  - `supabase/functions/api/routes/financial.ts`
  - Documentação/nota de decisão apenas se o executor tiver autorização para editar `.specs/decisions/`.
- **Arquivos proibidos quando aplicável**:
  - Mudanças amplas de autenticação/autorização fora de `/financial/analytics`.
- **Critérios de verificação**:
  - Está claro no código/revisão que sem `company_id` retorna agregação global, não limitada implicitamente por empresa.
  - Se JWT restritivo existir, há decisão explícita: permitir global, exigir permissão global ou bloquear.
  - Não há bypass acidental de `isCompanyInScope` para requests com `company_id` presente.
- **Comando de validação**: revisão de diff + testes de autorização relacionados se existirem.

### T07 — Atualizar `useFinancial` para analytics agregado

- **Requisitos rastreados**: `REQ-FAAC-004`, `REQ-FAAC-005`, `REQ-FAAC-006`
- **Objetivo**: permitir que a query de analytics rode no modo "Todas as empresas" sem serializar `company_id` vazio e sem gerar cache incorreto.
- **Dependências bloqueantes**: `T02`.
- **Pode rodar em paralelo**: sim, com `T04` após `T02`/`T03`; não depende do SQL final para ajuste local.
- **Arquivos permitidos**:
  - `apps/web/src/presentation/hooks/useFinancial.ts`
- **Arquivos proibidos quando aplicável**:
  - `FinancialGraphs`.
  - Repositórios SQL/API.
- **Critérios de verificação**:
  - `companyId === ''` não impede analytics agregado se os demais critérios de query forem válidos.
  - Requisição de analytics agregado omite `company_id`; não envia `''`, `null` como UUID ou placeholder inválido.
  - Query key diferencia modo agregado de empresa específica.
  - Com empresa específica, query key e payload continuam incluindo o `company_id` válido.
- **Comando de validação**: teste relacionado em `apps/web/src/__tests__/financial-analytics-rules.test.ts` + typecheck existente.

### T08 — Ajustar página financeira para não bloquear gráficos em "Todas as empresas"

- **Requisitos rastreados**: `REQ-FAAC-004`
- **Objetivo**: remover o bloqueio visual baseado apenas na ausência de `companyId`, preservando bloqueios realmente necessários de loading/erro/dados.
- **Dependências bloqueantes**: `T07`.
- **Pode rodar em paralelo**: não; depende do hook aceitar modo agregado.
- **Arquivos permitidos**:
  - `apps/web/src/app/(dashboard)/financial/page.tsx`
- **Arquivos proibidos quando aplicável**:
  - `FinancialGraphs`.
  - Contratos/API/backend.
- **Critérios de verificação**:
  - Ao selecionar "Todas as empresas", a página renderiza `FinancialGraphs` quando houver resposta de analytics.
  - A página não passa detalhes de SQL/API para componentes de UI.
  - O arquivo não recebe responsabilidade excessiva; se a lógica crescer, ela deve ser extraída para helper/hook existente ou novo módulo coeso aprovado pelo arquiteto.
- **Comando de validação**: typecheck existente; teste de regra pura em `T09` quando aplicável.

### T09 — Atualizar testes de regras puras do frontend

- **Requisitos rastreados**: `REQ-FAAC-004`, `REQ-FAAC-005`
- **Objetivo**: cobrir as regras que determinam quando analytics deve rodar e como o modo agregado é representado no frontend.
- **Dependências bloqueantes**: `T07`, `T08`.
- **Pode rodar em paralelo**: sim, com `T10` após implementações correspondentes.
- **Arquivos permitidos**:
  - `apps/web/src/__tests__/financial-analytics-rules.test.ts`
  - Arquivo de regra pura existente relacionado, se houver.
- **Arquivos proibidos quando aplicável**:
  - Infraestrutura nova de testes.
  - `FinancialGraphs`.
- **Critérios de verificação**:
  - Teste prova que sem empresa selecionada analytics pode ser habilitado.
  - Teste prova que `company_id` vazio não é serializado como UUID.
  - Teste prova que empresa específica preserva `company_id`.
  - Teste cobre diferenciação de cache/key se essa regra estiver exposta como função pura.
- **Comando de validação**: comando de testes existente que execute `apps/web/src/__tests__/financial-analytics-rules.test.ts`.

### T10 — Adicionar/atualizar testes de schema e rota de analytics

- **Requisitos rastreados**: `REQ-FAAC-007`, `REQ-FAAC-008`, `REQ-FAAC-009`
- **Objetivo**: verificar que a API aceita ausência de `company_id`, rejeita UUID inválido e preserva autorização por empresa específica.
- **Dependências bloqueantes**: `T03`, `T04`.
- **Pode rodar em paralelo**: sim, com `T09` e `T11` se houver infraestrutura existente.
- **Arquivos permitidos**:
  - Testes existentes da API/supabase, se houver.
  - `supabase/functions/api/validation/schemas.ts` apenas para ajuste necessário ao teste.
  - `supabase/functions/api/routes/financial.ts` apenas para ajuste necessário ao teste.
- **Arquivos proibidos quando aplicável**:
  - Criar nova infraestrutura de testes sem autorização explícita.
  - Alterar outros endpoints.
- **Critérios de verificação**:
  - Schema aceita analytics sem `company_id`.
  - Schema rejeita `company_id` inválido.
  - Rota com `company_id` válido continua verificando escopo.
  - Rota sem `company_id` segue a decisão documentada para agregação global ou bloqueio por permissão global, conforme `T06`.
- **Comando de validação**: teste de API existente identificado no projeto; se não existir, registrar limitação e validar por teste de schema isolado existente.

### T11 — Adicionar/atualizar testes do repositório de analytics

- **Requisitos rastreados**: `REQ-FAAC-001`, `REQ-FAAC-002`, `REQ-FAAC-003`
- **Objetivo**: verificar comportamento SQL/consulta para empresa específica e agregação global incluindo `company_id null`.
- **Dependências bloqueantes**: `T05`.
- **Pode rodar em paralelo**: sim, com `T09` e `T10` após `T05`.
- **Arquivos permitidos**:
  - Testes existentes do repositório financeiro, se houver.
  - `supabase/functions/api/repositories/financial.repository.ts` apenas para ajustes necessários ao teste.
- **Arquivos proibidos quando aplicável**:
  - Criar nova infraestrutura de banco/testes sem autorização explícita.
  - Alterar schema de banco.
- **Critérios de verificação**:
  - Com `company_id`, resultado contém apenas registros da empresa informada.
  - Sem `company_id`, resultado soma registros de múltiplas empresas.
  - Sem `company_id`, resultado inclui custos gerais com `company_id null`.
  - Não há regressão nos agregados existentes.
- **Comando de validação**: teste de repositório/API existente; se indisponível, registrar limitação e executar validação manual controlada com dados de desenvolvimento somente se permitido.

### T12 — Executar validação final integrada

- **Requisitos rastreados**: todos `REQ-FAAC-001` a `REQ-FAAC-009`
- **Objetivo**: validar a feature ponta a ponta no escopo mínimo: contratos, backend, frontend, testes e riscos.
- **Dependências bloqueantes**: `T06`, `T09`, `T10`, `T11`.
- **Pode rodar em paralelo**: não; task final.
- **Arquivos permitidos**:
  - Nenhuma alteração planejada; apenas ajustes mínimos se validação revelar falha diretamente relacionada.
- **Arquivos proibidos quando aplicável**:
  - Refatorações não relacionadas.
  - Alterações em `FinancialGraphs`.
  - Alterações fora do fluxo de analytics.
- **Critérios de verificação**:
  - `AC-FAAC-001`: gráficos aparecem para "Todas as empresas".
  - `AC-FAAC-002`: request agregado não envia `company_id` vazio.
  - `AC-FAAC-003`: agregação sem `company_id` soma múltiplas empresas.
  - `AC-FAAC-004`: agregação sem `company_id` inclui `company_id null`.
  - `AC-FAAC-005`: empresa específica permanece restrita.
  - `AC-FAAC-006`: UUID inválido continua falhando validação.
  - `AC-FAAC-007`: autorização do modo agregado foi revisada e registrada.
- **Comando de validação**:
  - Executar typecheck existente do projeto.
  - Executar testes relacionados ao frontend financeiro.
  - Executar testes relacionados à API/schema/repositório se existirem.
  - Executar build apenas se for comando existente e custo aceitável para o projeto.

## Matriz de rastreabilidade

| Requisito | Tasks |
| --- | --- |
| `REQ-FAAC-001` | `T03`, `T05`, `T11`, `T12` |
| `REQ-FAAC-002` | `T05`, `T11`, `T12` |
| `REQ-FAAC-003` | `T05`, `T11`, `T12` |
| `REQ-FAAC-004` | `T07`, `T08`, `T09`, `T12` |
| `REQ-FAAC-005` | `T02`, `T07`, `T09`, `T12` |
| `REQ-FAAC-006` | `T01`, `T02`, `T07`, `T12` |
| `REQ-FAAC-007` | `T01`, `T03`, `T04`, `T10`, `T12` |
| `REQ-FAAC-008` | `T04`, `T06`, `T10`, `T12` |
| `REQ-FAAC-009` | `T04`, `T06`, `T10`, `T12` |

## Acceptance criteria

- `tasks.md` existe em `.specs/features/financial-analytics-all-companies/`.
- O topo do arquivo contém exatamente `Agent: architect` e `Rules: AGENTS.md` nas duas primeiras linhas.
- Todas as tasks são atômicas, verificáveis e rastreáveis a pelo menos um `REQ-FAAC-*`.
- Dependências bloqueantes estão explícitas por task.
- Paralelismo e não paralelismo estão explícitos por task e no DAG.
- Cada task contém objetivo, arquivos permitidos, arquivos proibidos quando aplicável, critérios de verificação e comando de validação quando aplicável.
- O plano segue os estágios contratos → backend → frontend → testes → validação.
- As restrições arquiteturais incluem: não alterar `FinancialGraphs`, não expandir demais `financial/page.tsx`, não acoplar UI a SQL/API internals.
- O risco de segurança de `/financial/analytics` sem `company_id` está destacado com verificação esperada.

## Open questions

- A implementação terá um teste automatizado de API/repositório já existente para Supabase Functions, ou a validação backend será manual/documentada?
- Existe permissão global explícita no JWT/payload que deve ser exigida para analytics sem `company_id`, ou a decisão de somar tudo registrado no sistema é suficiente para este release?
- Se o arquivo `financial/page.tsx` já estiver próximo/acima de 300 linhas, o arquiteto autoriza extrair regra pura antes de alterar a renderização?
