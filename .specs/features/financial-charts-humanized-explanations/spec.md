# Spec: Explicações humanizadas nos gráficos financeiros

## Contexto

Os gráficos financeiros atuais em `apps/web/src/presentation/components/financial/FinancialGraphs.tsx`, `FinancialGraphsInsights.tsx` e `FinancialGraphsTooltip.tsx` já exibem histórico mensal, composição de despesas e projeção de 12 meses. Porém, os textos ainda usam rótulos técnicos ou resumidos, como `M/M`, `Composição acumulada` e `Saldo negativo`, que podem não ser claros para usuários sem familiaridade com finanças.

A feature existe para tornar os títulos, resumos, recomendações e tooltips mais compreensíveis em português, ajudando o usuário a entender o que o gráfico mostra, por que aquilo importa e qual ação prática pode tomar. O escopo é exclusivamente frontend e deve seguir os padrões existentes dos componentes financeiros, sem alterar API, domínio, hooks, contratos, schemas ou página financeira.

## Goals

- Tornar títulos, descrições, resumos textuais e tooltips dos gráficos financeiros mais humanos e acionáveis para usuários não especialistas.
- Explicar `M/M` como variação mês a mês em linguagem simples, evitando sigla sem contexto.
- Melhorar a interpretação dos três gráficos existentes:
  - histórico mensal;
  - composição de despesas fixas e variáveis;
  - projeção de 12 meses.
- Manter o resumo textual acessível útil mesmo quando a navegação interna dos gráficos Recharts for limitada.
- Preservar dados, cálculos, layout base e comportamento funcional existentes.
- Concentrar mudanças nos componentes financeiros já existentes; se o volume de copy crescer, extrair catálogo/helper pequeno e co-localizado.

## Non-goals / Fora de escopo

- Alterar APIs, hooks, contratos de domínio, schemas, entidades ou regras de cálculo financeiro.
- Criar novos gráficos, novas métricas, filtros, endpoints ou persistência.
- Alterar `apps/web/src/app/(dashboard)/financial/page.tsx`, que já possui 358 linhas e não deve receber responsabilidade de copy dos gráficos.
- Implementar i18n, tema, analytics, telemetria ou nova infraestrutura de testes.
- Redesenhar visualmente os gráficos ou trocar biblioteca de chart.
- Garantir consultoria financeira personalizada; as recomendações devem ser genéricas, prudentes e baseadas apenas nos dados já apresentados.

## Requisitos rastreáveis

- **REQ-FCHE-001**: O gráfico histórico deve ter título e/ou texto de apoio que explique que ele compara receitas, despesas e saldo ao longo dos meses.
- **REQ-FCHE-002**: O gráfico histórico deve explicar `M/M` como variação mês a mês em linguagem simples, nos pontos em que a sigla aparecer ou onde for substituída.
- **REQ-FCHE-003**: O resumo do histórico deve destacar o período, o saldo final e um insight acionável simples quando houver dados suficientes, como observar queda de saldo ou aumento de despesas.
- **REQ-FCHE-004**: O gráfico de composição de despesas deve explicar a diferença entre despesa fixa e variável com linguagem de negócio acessível.
- **REQ-FCHE-005**: O resumo de composição deve destacar a maior concentração entre fixo e variável e indicar uma leitura prática, como revisar gastos recorrentes ou investigar variações.
- **REQ-FCHE-006**: O gráfico de projeção de 12 meses deve deixar claro que se trata de uma estimativa futura, não de valor garantido.
- **REQ-FCHE-007**: O resumo da projeção deve indicar meses com saldo negativo e uma recomendação acionável quando houver risco projetado.
- **REQ-FCHE-008**: Tooltips dos três gráficos devem usar rótulos compreensíveis em português e complementar valores com contexto curto quando útil.
- **REQ-FCHE-009**: Estados sem dados ou com dados insuficientes devem continuar legíveis, sem quebrar renderização ou exibir mensagens técnicas.
- **REQ-FCHE-010**: O texto acessível fora dos elementos internos do Recharts deve continuar cobrindo os principais insights dos gráficos.
- **REQ-FCHE-011**: A implementação deve permanecer frontend-only e limitada aos componentes financeiros e, se necessário, a um helper/catalog co-localizado.
- **REQ-FCHE-012**: O código deve manter TypeScript estrito, sem `any`, `@ts-ignore`, `as unknown` ou double cast.

## Technical approach e decisões de design

- Trabalhar primeiro nos arquivos já responsáveis pela apresentação dos gráficos:
  - `apps/web/src/presentation/components/financial/FinancialGraphs.tsx` para títulos, labels, legendas e `aria-labels`;
  - `apps/web/src/presentation/components/financial/FinancialGraphsInsights.tsx` para resumos textuais e recomendações;
  - `apps/web/src/presentation/components/financial/FinancialGraphsTooltip.tsx` para tooltips humanizados.
- Não tocar em `apps/web/src/app/(dashboard)/financial/page.tsx`; a página não deve conhecer detalhes de copy dos gráficos.
- Manter os dados derivados já existentes (`HistoricalPoint`, `ExpensePoint`, `ForecastPoint`) e não alterar formato de entrada de `FinancialAnalytics`.
- Usar regras puras simples para gerar frases quando necessário, preferencialmente dentro de `FinancialGraphsInsights.tsx` se o volume permanecer pequeno.
- Se textos, thresholds ou recomendações crescerem a ponto de prejudicar legibilidade, criar um helper/catalog pequeno e co-localizado em `apps/web/src/presentation/components/financial/`, por exemplo `financialGraphCopy.ts`, sem criar nova camada global.
- Recomendações devem ser baseadas em sinais simples dos dados já disponíveis, como saldo final negativo, meses futuros negativos, maior peso de despesas fixas/variáveis ou aumento de despesa mês a mês.
- Evitar linguagem alarmista ou prescritiva demais. Usar frases como “vale revisar”, “acompanhe”, “pode indicar” e “priorize conferir”.
- Preservar classes, estrutura visual e componentes existentes sempre que possível para reduzir risco de regressão.

## Data structures ou interfaces envolvidas

Não há mudança planejada em contratos externos, schemas ou entidades. As estruturas envolvidas são internas aos componentes de apresentação:

- `ChartCard` em `FinancialGraphs.tsx`:
  - valores existentes: `'historical' | 'expense' | 'forecast'`.
- `HistoricalPoint`:
  - `month: string`
  - `income: number`
  - `expense: number`
  - `balance: number`
  - `momIncome: number | null`
  - `momExpense: number | null`
  - `momBalance: number | null`
- `ExpensePoint`:
  - `month: string`
  - `fixed: number`
  - `variable: number`
- `ForecastPoint`:
  - `month: string`
  - `income: number`
  - `expense: number`
  - `balance: number`
  - `isNegative: boolean`
- Possível helper co-localizado, se necessário:
  - funções puras para formatar explicações, tendências e recomendações;
  - sem dependência de API, hooks, domínio ou página.

## Target files

- Alterar preferencialmente:
  - `apps/web/src/presentation/components/financial/FinancialGraphs.tsx`
  - `apps/web/src/presentation/components/financial/FinancialGraphsInsights.tsx`
  - `apps/web/src/presentation/components/financial/FinancialGraphsTooltip.tsx`
- Criar somente se o volume de copy justificar:
  - `apps/web/src/presentation/components/financial/financialGraphCopy.ts`
- Evitar:
  - `apps/web/src/app/(dashboard)/financial/page.tsx`
  - `apps/web/src/presentation/hooks/**`
  - `apps/web/src/domain/**`
  - `apps/web/src/application/**`
  - `apps/web/src/infrastructure/**`
  - `supabase/**`

## Critérios de aceite

- **AC-FCHE-001**: Dado o gráfico histórico, quando o usuário visualizar título, resumo ou legenda, então deve entender que o gráfico compara receita, despesa e saldo ao longo dos meses.
- **AC-FCHE-002**: Dado qualquer menção a `M/M`, quando ela aparecer na interface, então deve estar explicada como “mês a mês” ou substituída por texto equivalente em português claro.
- **AC-FCHE-003**: Dado o gráfico histórico com dados, quando o resumo textual for exibido, então deve mostrar período, saldo final e uma leitura prática baseada nos dados disponíveis.
- **AC-FCHE-004**: Dado o gráfico de composição de despesas, quando o usuário visualizar resumo ou tooltip, então deve conseguir distinguir despesas fixas de variáveis sem conhecimento financeiro prévio.
- **AC-FCHE-005**: Dado o gráfico de composição com despesas, quando o resumo textual for exibido, então deve indicar qual grupo pesa mais no período ou informar claramente que não há despesas suficientes para comparar.
- **AC-FCHE-006**: Dado o gráfico de projeção de 12 meses, quando o usuário visualizar título, resumo ou tooltip, então deve ficar claro que os valores são estimativas futuras.
- **AC-FCHE-007**: Dado uma projeção com um ou mais meses de saldo negativo, quando o resumo textual for exibido, então deve recomendar revisar despesas, reforçar receitas ou planejar caixa antes desses meses.
- **AC-FCHE-008**: Dado uma projeção sem meses negativos, quando o resumo textual for exibido, então deve comunicar estabilidade projetada sem prometer resultado garantido.
- **AC-FCHE-009**: Dado dados vazios ou insuficientes em qualquer gráfico, quando o componente renderizar, então deve exibir texto amigável e não quebrar a interface.
- **AC-FCHE-010**: Dado uso de tecnologia assistiva, quando o usuário acessar a seção de gráficos, então o resumo textual deve continuar explicando os principais insights sem depender exclusivamente do gráfico visual.
- **AC-FCHE-011**: Dado o diff da implementação, então não deve haver alterações em API, domínio, hooks, schemas, contratos, banco ou `financial/page.tsx`.
- **AC-FCHE-012**: Dado a validação do workspace web, então lint, testes e build devem passar sem introduzir `any`, `@ts-ignore`, `as unknown` ou double cast.

## Validação esperada

Executar, no mínimo:

```bash
npm run lint --workspace @manager/web
npm run test --workspace @manager/web
npm run build --workspace @manager/web
```

Validação manual complementar:

- Revisar os três cartões do carrossel de gráficos.
- Conferir títulos, legendas, resumo textual, tooltips e `aria-labels`.
- Verificar cenários com dados positivos, saldo negativo, despesas fixas maiores, despesas variáveis maiores, projeção com meses negativos e dados vazios/insuficientes.
- Confirmar que nenhum payload, endpoint ou schema foi alterado.

## Riscos

- **Risco de excesso de texto**: explicações longas podem poluir a interface. Mitigação: manter resumo curto, com foco em uma leitura principal e uma recomendação.
- **Risco de recomendação enganosa**: frases podem soar como consultoria financeira definitiva. Mitigação: usar linguagem prudente e baseada nos dados apresentados.
- **Risco de duplicação de copy**: textos similares podem se espalhar entre componentes. Mitigação: criar helper/catalog co-localizado apenas se a duplicação ficar relevante.
- **Risco de regressão visual**: títulos e resumos maiores podem afetar espaçamento. Mitigação: preservar estrutura existente e validar visualmente os três gráficos.
- **Risco de acessibilidade**: melhorar apenas tooltips não ajuda leitores de tela. Mitigação: garantir que o resumo textual continue carregando os principais insights.

## Open questions

- Há termos financeiros específicos que o produto quer padronizar, como “receita”, “entrada”, “despesa”, “saída”, “saldo” e “caixa”?
- As recomendações devem seguir um tom mais neutro (“acompanhe”) ou mais orientado à ação (“revise agora”)?
- Existe preferência por manter a sigla `M/M` explicada ou remover a sigla da interface em favor de “variação mês a mês”?
