# Spec: Gráficos financeiros agregados para todas as empresas

## Contexto

A página financeira (`apps/web/src/app/(dashboard)/financial/page.tsx`) já representa a opção "Todas as empresas" com `companyId` vazio (`''`), mas hoje bloqueia a exibição dos gráficos quando não há empresa selecionada. O hook `useFinancial` e os contratos de analytics exigem `company_id`, e a API `/financial/analytics` valida `company_id` como obrigatório antes de consultar o repositório SQL.

A decisão de produto é que, quando nenhuma empresa estiver selecionada, os gráficos devem somar tudo que foi registrado no sistema. Para esta spec, isso significa que analytics sem `company_id` deve agregar todos os registros financeiros do sistema, incluindo custos gerais com `company_id null`, seguindo o comportamento de visão geral/report já existente em `getReport`/`findEntries`.

## Objetivo

Permitir que os gráficos financeiros sejam exibidos em modo agregado quando a opção "Todas as empresas" estiver selecionada, sem exigir `company_id` para analytics nesse cenário.

## Goals

- Exibir `FinancialGraphs` para "Todas as empresas" com dados agregados.
- Tornar `company_id` opcional no fluxo de analytics, do frontend até a API e repositório.
- Agregar registros financeiros de todas as empresas e custos gerais sem empresa quando `company_id` não for informado.
- Preservar o comportamento atual quando uma empresa específica for selecionada.

## Non-goals / Fora de escopo

- Alterar a regra de autorização para outros endpoints financeiros.
- Criar novos tipos de gráfico, métricas ou layout visual.
- Alterar o comportamento de `getReport` ou `findEntries`, exceto se necessário para manter consistência contratual documentada.
- Implementar filtros adicionais por usuário, unidade, centro de custo ou período além dos já existentes no analytics.
- Resolver definitivamente a política de escopo JWT restritivo; isso deve ser tratado no design/implementação como risco de segurança.

## Requisitos rastreáveis

- **REQ-FAAC-001**: Quando `company_id` não for informado no analytics, a API deve retornar métricas agregadas de todos os registros financeiros acessíveis pelo endpoint.
- **REQ-FAAC-002**: A agregação sem `company_id` deve incluir custos gerais com `company_id null`.
- **REQ-FAAC-003**: Quando `company_id` for informado, o analytics deve manter o comportamento atual, filtrando exclusivamente os registros da empresa informada.
- **REQ-FAAC-004**: A página financeira deve deixar de bloquear os gráficos apenas por ausência de `companyId`.
- **REQ-FAAC-005**: O hook `useFinancial` deve permitir executar a query de analytics sem `company_id` quando o modo for "Todas as empresas".
- **REQ-FAAC-006**: Os contratos TypeScript do domínio, use case e repositório HTTP devem representar `company_id` como opcional apenas para analytics.
- **REQ-FAAC-007**: A validação da API para `/financial/analytics` deve aceitar payload/query sem `company_id` e continuar validando UUID quando `company_id` for enviado.
- **REQ-FAAC-008**: A autorização por empresa específica deve continuar usando `isCompanyInScope(payload, company_id)` quando `company_id` for informado.
- **REQ-FAAC-009**: O comportamento sem `company_id` deve ser explicitamente revisado contra escopo JWT restritivo antes da implementação final.

## Technical approach e decisões de design

- Tornar `company_id` opcional somente no contrato de analytics, evitando expandir a mudança para entradas, relatórios ou outros fluxos financeiros.
- No frontend, tratar `companyId === ''` como ausência de filtro por empresa em analytics, não como estado inválido.
- No hook `useFinancial`, a query de analytics deve ser habilitada para o modo agregado mesmo sem `company_id`, preservando os demais critérios de habilitação já existentes.
- Na API, `financialAnalyticsQuerySchema` deve aceitar ausência de `company_id`; quando presente, deve continuar exigindo UUID válido.
- No repositório SQL, `getAnalytics` deve aplicar filtro por igualdade quando `company_id` existir e remover esse filtro quando não existir, incluindo registros com `company_id null` no modo agregado.
- A regra de autorização deve permanecer restritiva para empresa específica. Para modo agregado, o design de implementação deve decidir se o JWT permite visão global ou se é necessário limitar a agregação às empresas em escopo.

## Data structures ou interfaces envolvidas

- `FinancialAnalyticsQuery` / schema equivalente em `supabase/functions/api/validation/schemas.ts`:
  - `company_id?: uuid`
  - demais filtros existentes permanecem inalterados.
- Contratos web de analytics:
  - domínio repository financeiro
  - use case financeiro
  - HTTP repository financeiro
  - todos devem aceitar `company_id` opcional no método/entrada de analytics.
- `useFinancial`:
  - entrada deve representar modo agregado sem `company_id`.
  - query key deve diferenciar empresa específica de modo agregado para evitar cache incorreto.
- `FinancialGraphs`:
  - não requer alteração funcional por não depender de `company_id`.

## Critérios de aceite

- **AC-FAAC-001**: Dado que nenhuma empresa está selecionada, quando a página financeira carregar, então os gráficos financeiros devem ser exibidos em vez do aviso de bloqueio por ausência de empresa.
- **AC-FAAC-002**: Dado que nenhuma empresa está selecionada, quando analytics for requisitado, então a requisição não deve enviar `company_id` vazio como UUID inválido.
- **AC-FAAC-003**: Dado analytics sem `company_id`, quando houver registros de múltiplas empresas, então os valores dos gráficos devem refletir a soma agregada desses registros.
- **AC-FAAC-004**: Dado analytics sem `company_id`, quando houver custos gerais com `company_id null`, então esses custos devem ser incluídos na agregação.
- **AC-FAAC-005**: Dado analytics com `company_id` válido, quando os dados forem retornados, então o resultado deve permanecer restrito à empresa selecionada.
- **AC-FAAC-006**: Dado analytics com `company_id` inválido, quando a API validar a entrada, então deve retornar erro de validação como hoje.
- **AC-FAAC-007**: Dado usuário/JWT sem permissão global clara, quando analytics agregado for solicitado, então a decisão de autorização deve estar documentada e validada antes de liberar a implementação.

## Validação esperada

- Atualizar ou criar testes de regras puras em `apps/web/src/__tests__/financial-analytics-rules.test.ts` para cobrir modo agregado sem empresa selecionada.
- Validar que a query de analytics roda sem `company_id` e não roda com `company_id` vazio serializado como UUID.
- Validar contrato/schema da API para aceitar ausência de `company_id` e rejeitar valor inválido.
- Validar repositório SQL com casos:
  - empresa específica mantém filtro por igualdade;
  - sem empresa soma múltiplas empresas;
  - sem empresa inclui `company_id null`.
- Executar validações existentes identificáveis do projeto, no mínimo typecheck e testes relacionados, se disponíveis.

## Riscos e decisões

- **Decisão**: `company_id` opcional se aplica apenas ao endpoint/fluxo de analytics.
- **Decisão**: ausência de `company_id` significa visão agregada de todas as empresas e custos gerais sem empresa.
- **Risco de segurança**: se o JWT tiver escopo restritivo por empresa, agregar todos os registros do sistema pode expor dados fora do escopo do usuário. A implementação deve revisar a semântica de `payload` e definir se o modo agregado requer permissão global ou se deve agregar apenas empresas autorizadas.
- **Risco de cache**: a query key do frontend deve diferenciar explicitamente modo agregado e empresa específica para evitar reutilização de dados incorretos.
- **Risco de contrato**: tornar `company_id` opcional em camadas compartilhadas pode afetar chamadas existentes; a mudança deve ser localizada ao analytics.

## Open questions

- No modo agregado, usuários com JWT restritivo devem ver todas as empresas do sistema ou apenas as empresas no escopo do token?
- Existe um papel/permissão explícita para visão financeira global que deve ser exigida antes de permitir analytics sem `company_id`?
- A API deve retornar erro de autorização para modo agregado sem permissão global ou deve degradar automaticamente para agregação limitada ao escopo do JWT?
