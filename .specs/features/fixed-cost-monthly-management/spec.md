# Gestão mensal de custos fixos por mês

## Contexto

O fluxo mensal de custos fixos já separa `fixed_costs` como cadastro recorrente/base e `fixed_cost_monthly_entries` como valor mensal persistido quando há intervenção no mês. A nova regra de negócio simplifica o fluxo operacional:

- custos fixos recorrentes dentro da vigência devem nascer confirmados para o mês selecionado;
- o usuário pode editar assim que seleciona um mês válido;
- apenas mês `closed` bloqueia edição comum;
- o frontend deve remover labels, microcopy e ações visuais que pressupõem um passo manual de confirmação do mês.

Essa mudança existe para eliminar um passo operacional sem valor real, reduzir ambiguidade entre `predicted`/`open`/`confirmed` e manter a edição mensal simples: selecionar mês válido, revisar, editar se necessário e fechar quando quiser congelar o resultado.

## Objetivos

- Tornar `confirmed` o estado operacional padrão de custos recorrentes válidos no mês.
- Permitir edição imediata de qualquer custo recorrente aplicável ao mês selecionado.
- Manter `closed` como único bloqueio operacional de edição mensal.
- Simplificar backend, API, queries financeiras e frontend para que não dependam mais de confirmação manual do mês.
- Deixar explícito o tratamento de compatibilidade para meses, snapshots e status legados já existentes.

## Não objetivos

- Criar job de materialização automática para todos os meses futuros.
- Inserir custos fixos automaticamente em `financial_entries`.
- Reabrir mês `closed` nesta etapa.
- Refatorar a página financeira além do necessário para suportar a regra simplificada.
- Alterar a regra de filtro por empresa de custos gerais `company_id = null`.

## O que muda no fluxo

### Fluxo novo

1. Usuário entra na aba `Custos Fixos`.
2. O sistema abre no mês atual.
3. Ao selecionar um mês dentro da vigência do custo recorrente, a linha já nasce operacionalmente confirmada.
4. O usuário pode editar imediatamente.
5. Ao editar, o sistema cria ou atualiza `fixed_cost_monthly_entries` para aquele mês.
6. Ao fechar o mês, o sistema bloqueia novas edições comuns.

### O que deixa de existir ou perde função operacional

- Ação manual de `confirmar mês` deixa de existir no fluxo principal.
- Status `predicted` deixa de existir como estado operacional de linha para custos recorrentes válidos.
- Status `open` deixa de existir como estado operacional de mês.
- Badge, CTA, diálogo e microcopy de confirmação de mês deixam de fazer sentido no frontend.
- Mensagens extensas de “snapshot/preservação” deixam de ser UX primária; permanecem apenas como indicação contextual quando houver dado legado fora da vigência atual.

### O que permanece

- `fixed_costs` continua como cadastro recorrente/base.
- `fixed_cost_monthly_entries` continua como override/snapshot mensal quando houver edição ou legado materializado.
- `closed` continua bloqueando edição comum.
- Relatórios, lançamentos e analytics continuam usando precedência `monthly entry > base dinâmica`.

## Abordagem técnica e decisões de design

### D1 — Custos recorrentes válidos são resolvidos como confirmados por padrão

Para meses dentro da vigência, a linha resolvida via base dinâmica deve ser retornada com estado efetivo `confirmed`, mesmo quando ainda não existe `fixed_cost_monthly_entries`.

### D2 — Confirmação manual sai do contrato operacional

O produto não exige mais um passo explícito de confirmação. A modelagem deve tratar o mês como utilizável imediatamente. Se existir endpoint/tabela de confirmação legados, eles deixam de ser necessários para o fluxo principal.

### D3 — Apenas `closed` bloqueia edição

Se o mês não estiver `closed`, a edição é permitida para qualquer custo aplicável ao mês. O backend e o frontend não devem bloquear edição por `confirmed`.

### D4 — Não materializar todos os meses automaticamente

A regra “nasce confirmado” é lógica, não implica criar snapshots para todos os meses. O sistema continua criando `fixed_cost_monthly_entries` apenas quando:

- o usuário edita o mês; ou
- já existe dado legado materializado para aquele mês.

### D5 — `confirmed` deixa de ser sinal visual obrigatório por linha

Como `confirmed` passa a ser o comportamento padrão, o frontend não deve poluir a tabela com badges redundantes de confirmação em todas as linhas. O estado que realmente precisa de destaque operacional é `closed`. Diferenças como “editado neste mês” podem aparecer como indicador secundário, não como etapa de workflow.

### D6 — Compatibilidade com legado deve normalizar estados antigos

Meses ou linhas legadas com `predicted`, `open` ou equivalentes devem ser lidos como `confirmed` sempre que não estiverem `closed`.

Recomendação de compatibilidade:

- leitura: mapear `predicted`/`open`/`confirmed` legados para estado efetivo `confirmed`;
- escrita: não gerar novos registros com `predicted` ou `open`;
- migração opcional futura: normalizar dados persistidos para reduzir complexidade histórica.

### D7 — Snapshots legados continuam válidos, mas com UX mais discreta

Se existir snapshot mensal legado para custo hoje fora da vigência ou inativo, ele continua visível e prevalece nos cálculos daquele mês. A UI não deve mais enfatizar “preservação” como fluxo principal; basta indicar de forma discreta que existe valor salvo naquele mês quando isso for relevante para explicar a linha.

### D8 — Queries financeiras não dependem mais de status intermediário

`GET /financial/entries`, `GET /financial/report` e `GET /financial/analytics` devem resolver valores mensais pela precedência de origem, não por filtros de confirmação intermediária. `closed` só afeta editabilidade, não inclusão do valor no cálculo.

### D9 — Frontend simplifica status e ações

Na aba `Custos Fixos`:

- remover CTA de confirmar mês;
- remover diálogo de confirmação de mês;
- remover microcopy de “revise e confirme o mês”;
- remover badge/status visual de `predicted` e `confirmed` quando apenas repetirem o comportamento padrão;
- manter indicação visível de mês `closed` e bloqueio correspondente;
- manter distinção entre `Gestão mensal` e `Cadastro recorrente`.

## Requisitos

- FCM-001: `GET /fixed-costs/monthly` deve retornar custos recorrentes válidos do mês como operacionalmente `confirmed`, mesmo sem snapshot persistido.
- FCM-002: `PUT /fixed-costs/:id/monthly/:reference_year/:reference_month` deve permitir edição imediata para mês válido não `closed`.
- FCM-003: Apenas mês `closed` deve bloquear edição comum no backend.
- FCM-004: O sistema não deve exigir endpoint ou ação manual de confirmação para habilitar edição ou consolidar o mês.
- FCM-005: O sistema não deve criar novos registros com status operacional `predicted` ou `open`.
- FCM-006: Leituras de meses/linhas legados com `predicted`, `open` ou `confirmed` devem ser normalizadas para estado efetivo `confirmed` quando o mês não estiver `closed`.
- FCM-007: A precedência de cálculo mensal deve continuar sendo `fixed_cost_monthly_entries` quando existir e base dinâmica `fixed_costs` + ajuste mensal aplicável quando não existir.
- FCM-008: Relatórios, lançamentos e analytics não devem depender de confirmação manual para incluir custos fixos do mês.
- FCM-009: O frontend deve remover ação visual de confirmar mês e textos que pressupõem esse passo.
- FCM-010: O frontend deve permitir editar assim que o usuário selecionar um mês válido.
- FCM-011: O frontend deve manter bloqueio visual e textual apenas para mês `closed`.
- FCM-012: Mensagens de snapshot/preservação devem ser reduzidas a contexto explicativo apenas quando necessário para linhas legadas fora da vigência atual.
- FCM-013: A feature não deve criar uma nova aba principal; a gestão mensal continua dentro de `Custos Fixos`.
- FCM-014: A aba `Custos Fixos` continua abrindo no mês atual e sem filtro global de período.
- FCM-015: A edição mensal continua sem alterar `fixed_costs`.

## Estruturas de dados e interfaces

### Estado mensal efetivo

Estado operacional recomendado do mês:

- `confirmed`
- `closed`

Estados `predicted` e `open` passam a ser apenas legados de leitura, não de escrita.

### Linha mensal resolvida

```text
FixedCostMonthlyLine
- id
- fixed_cost_id
- reference_year
- reference_month
- name
- base_amount
- month_adjustment_amount
- monthly_amount
- source: dynamic_base | monthly_entry
- effective_status: confirmed | closed
- is_edited: boolean
- is_editable: boolean
- edit_block_reason?: month_closed | before_start_date | after_end_date | inactive | archived
- legacy_context?: out_of_range_snapshot | inactive_snapshot
```

Decisões de interface:

- `effective_status` substitui dependência operacional de `predicted`/`open`.
- `is_edited` comunica override mensal sem criar um novo estágio de workflow.
- `legacy_context` existe apenas para permitir explicação discreta de snapshots legados quando a base atual não justificaria mais a linha.

### Estado do mês

```text
FixedCostMonthState
- reference_year
- reference_month
- status: confirmed | closed
- is_editable: boolean
```

Se a estrutura `fixed_cost_months` já existir, ela pode continuar armazenando `closed`. `confirmed` pode ser inferido como default efetivo quando não houver fechamento.

## Impactos no backend

- O resolvedor mensal deve devolver linhas válidas com `effective_status = confirmed` por padrão.
- Use cases e repositórios não devem depender de confirmação manual para permitir edição.
- Se existir `confirm-fixed-cost-month.ts`, ele deve ser removido do fluxo principal ou tratado como endpoint legado/deprecado sem efeito operacional novo.
- Validação de editabilidade deve se resumir a:
  - mês válido para a vigência do custo; e
  - mês não `closed`.
- Persistência nova não deve usar `predicted`/`open`.
- Leitura de registros legados deve normalizar status antigos para `confirmed` quando aplicável.

## Impactos na API

### Endpoints principais

`GET /fixed-costs/monthly?reference_year=YYYY&reference_month=MM&company_id=<opcional>`

- retorna mês resolvido com status efetivo `confirmed` ou `closed`;
- retorna linhas já editáveis para mês válido não `closed`;
- não depende de confirmação manual para liberar edição.

`PUT /fixed-costs/:id/monthly/:reference_year/:reference_month`

- cria ou atualiza override mensal;
- não altera cadastro base;
- rejeita apenas mês `closed` ou custo inválido para o mês.

### Compatibilidade de endpoint legado

`POST /fixed-costs/monthly/:reference_year/:reference_month/confirm`

- deixa de ser necessário para o fluxo principal;
- recomendação: manter temporariamente como endpoint deprecated e idempotente, retornando o mês já `confirmed`, ou removê-lo em breaking change explícita.

`POST /fixed-costs/monthly/:reference_year/:reference_month/close`

- permanece necessário;
- continua sendo a transição que congela edição comum.

## Impactos nas queries financeiras

- Remover dependência de `predicted`/`open`/confirmação manual para compor totais.
- Garantir precedência `monthly entry > base dinâmica` em:
  - `GET /financial/entries`
  - `GET /financial/report`
  - `GET /financial/analytics`
- `closed` não exclui nem altera valor financeiro; apenas bloqueia edição posterior.
- Queries legadas que filtrarem por `confirmed` devem ser revisadas para não exigir registro materializado onde só existe base dinâmica válida.
- Continuar evitando dupla contagem entre `fixed_costs`, `fixed_cost_monthly_entries`, `fixed_cost_interests` e `financial_entries`.

## Impactos no frontend

### Simplificações obrigatórias

- Remover botão/CTA de `Confirmar mês`.
- Remover diálogo de confirmação de mês.
- Remover status visual `Previsto` quando ele só indicar linha válida ainda não editada.
- Remover badge/label redundante de `Confirmado` por linha quando não houver informação adicional útil.
- Remover microcopy de snapshot/preservação como mensagem central da tela.

### Comportamento esperado

- Usuário seleciona mês válido e já pode editar.
- Apenas mês `Fechado` desabilita edição.
- `Gestão mensal` e `Cadastro recorrente` continuam separados.
- A UI pode usar indicador secundário como `Editado neste mês` quando existir override mensal.
- Casos legados de snapshot fora da vigência atual devem usar mensagem curta e contextual, não banner principal.

### Componentes e hooks afetados

- `apps/web/src/app/(dashboard)/financial/page.tsx`
- `FixedCostsSection.tsx`
- `FixedCostRow.tsx`
- `FixedCostsSummaryCards.tsx`
- `FixedCostForm.tsx`
- `FixedCostInterestForm.tsx`
- `FixedCostInterestSection.tsx`
- `FinancialEntriesTable.tsx`
- `FinancialGraphs.tsx`
- `FinancialGraphsInsights.tsx`
- `FinancialMonthlyTable.tsx`
- hooks/DTOs de `useFixedCosts` e futuro `useFixedCostCompetence`

## Compatibilidade e legado

- Snapshots mensais já existentes continuam prevalecendo no mês a que pertencem.
- Meses legados com status `open` devem ser tratados como `confirmed` se não estiverem `closed`.
- Linhas legadas com status `predicted` devem ser lidas como `confirmed` para não manter dois fluxos operacionais.
- Se houver UI, queries ou testes que dependem explicitamente de “confirmar mês”, eles devem ser atualizados para o novo default.
- A existência de `fixed_cost_months` pode ser reduzida a controle de fechamento; confirmação deixa de ser dependência funcional.

## Validação

### Backend e API

- Mês válido sem snapshot retorna linhas resolvidas com `effective_status = confirmed`.
- Mês válido sem snapshot aceita edição imediata.
- `PUT` em mês `closed` retorna erro tipado.
- `PUT` em mês não `closed` não depende de confirmação prévia.
- Leitura de status legados `predicted`/`open` resulta em estado efetivo `confirmed`.
- Nenhuma escrita nova persiste `predicted` ou `open`.

### Queries financeiras

- `financial/entries`, `financial/report` e `financial/analytics` incluem custo recorrente válido mesmo sem snapshot materializado.
- Quando existe `fixed_cost_monthly_entries`, ele prevalece sobre a base dinâmica.
- Não há dupla contagem.
- Fechamento não altera o valor calculado, apenas editabilidade.

### Frontend

- A aba `Custos Fixos` abre no mês atual.
- Ao selecionar mês válido, a ação de editar está disponível sem confirmação manual.
- Não existe botão ou diálogo de confirmar mês.
- Não existe badge operacional de `Previsto` para linhas recorrentes válidas.
- Mês `Fechado` mostra bloqueio claro de edição.
- Copy de snapshot/preservação só aparece em contexto legado necessário e de forma curta.

### Comandos de validação

- Rodar lint/typecheck/test/build existentes, se disponíveis.
- Comandos prováveis já identificados:
  - `npm run lint --workspace @manager/web`
  - `npm run test --workspace @manager/web`
  - `npm run build --workspace @manager/web`

## Critérios de aceite

- AC-001: Custos fixos recorrentes dentro da vigência aparecem como confirmados por padrão no mês selecionado, mesmo sem snapshot persistido.
- AC-002: O usuário pode editar imediatamente após selecionar um mês válido.
- AC-003: Apenas mês `closed` bloqueia edição comum.
- AC-004: O fluxo não exige mais ação manual de confirmação do mês.
- AC-005: O backend/API não geram novos estados operacionais `predicted` ou `open`.
- AC-006: Meses e linhas legados com `predicted`/`open` são tratados como `confirmed` para leitura e uso operacional.
- AC-007: Relatórios, lançamentos e analytics usam custo mensal efetivo sem depender de confirmação manual.
- AC-008: Quando existe override mensal, ele prevalece sobre a base dinâmica nas queries financeiras.
- AC-009: O frontend remove CTA, diálogo e microcopy de confirmação de mês.
- AC-010: O frontend não exibe `Previsto` como estado operacional para custo recorrente válido ainda não editado.
- AC-011: O frontend mantém indicação clara de mês `Fechado` e respectivo bloqueio.
- AC-012: Casos legados com snapshot fora da vigência atual continuam visíveis e usam explicação contextual curta.

## Open questions that need clarification

1. O endpoint legado de confirmação deve ser apenas deprecated/idempotente por um ciclo ou removido imediatamente como breaking change?
2. Existe algum consumidor externo da API que ainda dependa explicitamente de `predicted`, `open` ou do endpoint de confirmação?
3. O frontend deve manter um indicador secundário `Editado neste mês` na tabela principal ou isso também deve sair para maximizar simplificação?
