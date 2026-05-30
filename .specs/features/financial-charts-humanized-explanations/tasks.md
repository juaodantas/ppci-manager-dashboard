Agent: architect
Rules: AGENTS.md

# Tasks: Explicações humanizadas nos gráficos financeiros

## Contexto

A feature especificada em `.specs/features/financial-charts-humanized-explanations/spec.md` melhora a linguagem dos gráficos financeiros para usuários não especialistas. O trabalho é frontend-only e deve ficar restrito aos componentes de gráficos financeiros, preservando dados, cálculos, APIs, hooks, contratos, schemas e página financeira.

## Goals

- Transformar requisitos `REQ-FCHE-*` em tarefas implementáveis, atômicas e verificáveis.
- Manter mudanças localizadas nos componentes financeiros existentes.
- Garantir que títulos, explicações, resumos, recomendações, tooltips e textos acessíveis sejam compreensíveis em português.
- Definir comandos de validação obrigatórios para o workspace web.

## Non-goals

- Implementar código neste arquivo.
- Alterar API, domínio, hooks, schemas, banco, contratos ou página financeira.
- Criar novos gráficos, métricas, filtros ou layout visual.
- Criar infraestrutura nova de i18n, testes, analytics ou design system.

## Restrições arquiteturais obrigatórias

- Não alterar `apps/web/src/app/(dashboard)/financial/page.tsx`.
- Não alterar `apps/web/src/presentation/hooks/**`, `apps/web/src/domain/**`, `apps/web/src/application/**`, `apps/web/src/infrastructure/**` ou `supabase/**`.
- Não modificar shape de `FinancialAnalytics` nem cálculos financeiros.
- Não usar `any`, `@ts-ignore`, `as unknown` ou double cast.
- Se a copy crescer, extrair apenas para helper/catalog pequeno e co-localizado em `apps/web/src/presentation/components/financial/`.
- Recomendações devem ser genéricas, prudentes e derivadas apenas dos dados já disponíveis nos pontos dos gráficos.

## Target files

- Permitidos:
  - `apps/web/src/presentation/components/financial/FinancialGraphs.tsx`
  - `apps/web/src/presentation/components/financial/FinancialGraphsInsights.tsx`
  - `apps/web/src/presentation/components/financial/FinancialGraphsTooltip.tsx`
  - `apps/web/src/presentation/components/financial/financialGraphCopy.ts`, somente se necessário
- Proibidos para esta feature:
  - `apps/web/src/app/(dashboard)/financial/page.tsx`
  - `apps/web/src/presentation/hooks/**`
  - `apps/web/src/domain/**`
  - `apps/web/src/application/**`
  - `apps/web/src/infrastructure/**`
  - `supabase/**`

## Plano de execução DAG / staged

```text
Stage 1: levantamento de copy
  T01

Stage 2: títulos e textos estruturais
  T01 -> T02

Stage 3: resumos e recomendações
  T01 -> T03

Stage 4: tooltips e acessibilidade
  T02/T03 -> T04 -> T05

Stage 5: validação
  T02/T03/T04/T05 -> T06 -> T07
```

- Paralelizável: `T02` e `T03` podem rodar em paralelo após `T01`.
- Não paralelizável: `T04` depende da direção textual definida em `T02` e `T03`; `T05` depende do conteúdo final dos resumos/tooltips; `T06` e `T07` dependem das alterações completas.

## Tasks atômicas

### T01 — Mapear textos financeiros atuais e definir tom

- **Requisitos rastreados**: `REQ-FCHE-001` a `REQ-FCHE-012`
- **Objetivo**: revisar títulos, legendas, resumos, tooltips e `aria-labels` atuais para identificar termos técnicos, siglas e pontos sem recomendação prática.
- **Dependências bloqueantes**: nenhuma.
- **Pode rodar em paralelo**: não; orienta as demais tasks.
- **Arquivos de leitura**:
  - `apps/web/src/presentation/components/financial/FinancialGraphs.tsx`
  - `apps/web/src/presentation/components/financial/FinancialGraphsInsights.tsx`
  - `apps/web/src/presentation/components/financial/FinancialGraphsTooltip.tsx`
- **Critérios de verificação**:
  - Lista de textos atuais revisada antes de alterar.
  - Decisão local tomada sobre manter `M/M` explicado ou substituir por “variação mês a mês”.
  - Nenhuma alteração fora dos componentes financeiros planejada.
- **Comando de validação**: não aplicável; verificação por leitura.

### T02 — Humanizar títulos, legendas e descrições estruturais

- **Requisitos rastreados**: `REQ-FCHE-001`, `REQ-FCHE-002`, `REQ-FCHE-004`, `REQ-FCHE-006`, `REQ-FCHE-010`, `REQ-FCHE-011`
- **Objetivo**: ajustar títulos do carrossel, nomes de séries, textos de apoio e `aria-labels` para explicar melhor o que cada gráfico mostra.
- **Dependências bloqueantes**: `T01`.
- **Pode rodar em paralelo**: sim, com `T03`.
- **Arquivos permitidos**:
  - `apps/web/src/presentation/components/financial/FinancialGraphs.tsx`
  - helper/catalog co-localizado somente se necessário
- **Critérios de verificação**:
  - Histórico comunica comparação de receita, despesa e saldo por mês.
  - `M/M` aparece explicado como mês a mês ou é substituído por texto claro.
  - Composição comunica fixo e variável em linguagem simples.
  - Projeção comunica estimativa de 12 meses, sem promessa de garantia.
  - `aria-labels` continuam úteis e em português.
- **Comando de validação**: `npm run lint --workspace @manager/web` ao final da implementação completa.

### T03 — Melhorar resumos textuais e recomendações acionáveis

- **Requisitos rastreados**: `REQ-FCHE-003`, `REQ-FCHE-005`, `REQ-FCHE-006`, `REQ-FCHE-007`, `REQ-FCHE-008`, `REQ-FCHE-009`, `REQ-FCHE-010`, `REQ-FCHE-012`
- **Objetivo**: enriquecer `FinancialGraphsInsights` com explicações curtas e recomendações práticas derivadas dos dados existentes.
- **Dependências bloqueantes**: `T01`.
- **Pode rodar em paralelo**: sim, com `T02`.
- **Arquivos permitidos**:
  - `apps/web/src/presentation/components/financial/FinancialGraphsInsights.tsx`
  - helper/catalog co-localizado somente se necessário
- **Critérios de verificação**:
  - Histórico mostra período, saldo final e leitura prática.
  - Composição indica se fixo ou variável pesa mais, ou informa ausência de dados suficientes.
  - Projeção informa quantidade de meses negativos e recomendação quando houver risco.
  - Projeção sem meses negativos comunica estabilidade como estimativa, não garantia.
  - Estados vazios ou insuficientes permanecem amigáveis.
  - Nenhum cálculo altera dados de origem; apenas interpreta dados já recebidos.
- **Comando de validação**: `npm run test --workspace @manager/web` ao final da implementação completa.

### T04 — Humanizar tooltips dos três gráficos

- **Requisitos rastreados**: `REQ-FCHE-002`, `REQ-FCHE-004`, `REQ-FCHE-006`, `REQ-FCHE-008`, `REQ-FCHE-009`, `REQ-FCHE-012`
- **Objetivo**: ajustar rótulos e microcopy dos tooltips para que cada valor tenha contexto compreensível sem jargão desnecessário.
- **Dependências bloqueantes**: `T02`, `T03`.
- **Pode rodar em paralelo**: não; deve manter consistência com títulos e resumos.
- **Arquivos permitidos**:
  - `apps/web/src/presentation/components/financial/FinancialGraphsTooltip.tsx`
  - helper/catalog co-localizado somente se necessário
- **Critérios de verificação**:
  - Tooltip histórico explica variação mês a mês de receita, despesa e saldo.
  - Tooltip de composição diferencia fixo e variável com termos claros.
  - Tooltip de projeção indica que os valores são previstos/estimados.
  - Saldos negativos aparecem com orientação curta e não alarmista.
  - Type guards existentes continuam sem cast inseguro.
- **Comando de validação**: `npm run lint --workspace @manager/web` ao final da implementação completa.

### T05 — Revisar resumo acessível e consistência de linguagem

- **Requisitos rastreados**: `REQ-FCHE-001` a `REQ-FCHE-010`
- **Objetivo**: garantir que a interface textual continue útil sem depender da leitura visual do gráfico ou do tooltip.
- **Dependências bloqueantes**: `T04`.
- **Pode rodar em paralelo**: não.
- **Arquivos permitidos**:
  - `apps/web/src/presentation/components/financial/FinancialGraphs.tsx`
  - `apps/web/src/presentation/components/financial/FinancialGraphsInsights.tsx`
  - `apps/web/src/presentation/components/financial/FinancialGraphsTooltip.tsx`
  - helper/catalog co-localizado somente se necessário
- **Critérios de verificação**:
  - O texto “Resumo do gráfico” ou equivalente apresenta insight suficiente para tecnologia assistiva.
  - Nota sobre limitações do Recharts permanece verdadeira e compatível com os novos resumos.
  - Termos usados nos títulos, legendas, resumos e tooltips são consistentes.
  - Não há frases contraditórias entre gráfico, tooltip e resumo.
- **Comando de validação**: revisão manual de UI e acessibilidade textual.

### T06 — Executar validações automatizadas do workspace web

- **Requisitos rastreados**: `REQ-FCHE-011`, `REQ-FCHE-012`
- **Objetivo**: validar lint, testes e build após as alterações de copy/componentes.
- **Dependências bloqueantes**: `T02`, `T03`, `T04`, `T05`.
- **Pode rodar em paralelo**: não; deve rodar após implementação.
- **Arquivos permitidos**: nenhum ajuste planejado; correções localizadas nos arquivos permitidos se houver falha.
- **Critérios de verificação**:
  - Lint passa.
  - Testes do workspace web passam ou falhas preexistentes são identificadas com evidência.
  - Build do workspace web passa.
- **Comandos de validação**:
  - `npm run lint --workspace @manager/web`
  - `npm run test --workspace @manager/web`
  - `npm run build --workspace @manager/web`

### T07 — Revisar diff final contra escopo frontend-only

- **Requisitos rastreados**: `REQ-FCHE-011`, `REQ-FCHE-012`
- **Objetivo**: confirmar que o diff final respeita o escopo e não altera contratos, hooks, domínio, API, schema, banco ou página financeira.
- **Dependências bloqueantes**: `T06`.
- **Pode rodar em paralelo**: não.
- **Arquivos permitidos**:
  - Apenas os arquivos listados em “Target files”.
- **Critérios de verificação**:
  - Diff contém somente componentes financeiros permitidos e possível helper/catalog co-localizado.
  - Nenhuma alteração em `financial/page.tsx`.
  - Nenhuma alteração em API/domain/schema/hook/contract.
  - Validações executadas registradas na resposta final da implementação.
- **Comando de validação**: revisão de diff + comandos de `T06`.

## Validation commands

Executar após a implementação:

```bash
npm run lint --workspace @manager/web
npm run test --workspace @manager/web
npm run build --workspace @manager/web
```

## Riscos e mitigação

- **Copy longa demais**: manter resumos curtos; extrair helper apenas se melhorar legibilidade.
- **Recomendação parecer aconselhamento financeiro definitivo**: usar linguagem prudente e contextual.
- **Mudança acidental de regra de negócio**: não alterar cálculos, dados de entrada ou contratos.
- **Acessibilidade insuficiente**: garantir que o resumo textual carregue os principais insights, não apenas tooltips.
- **Expansão de escopo**: revisar diff final para bloquear alterações em hooks, API, domínio, schemas e página financeira.

## Open questions

- Manter a sigla `M/M` com explicação curta ou remover a sigla da interface?
- O tom das recomendações deve ser mais consultivo ou mais neutro?
- Existe glossário de produto para padronizar “entrada/receita”, “saída/despesa” e “saldo/caixa”?
