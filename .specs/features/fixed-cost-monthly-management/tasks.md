# Tasks — Gestão mensal de custos fixos por mês

Agent: architect
Rules: AGENTS.md

## Contexto

A spec foi simplificada para que custos fixos recorrentes válidos nasçam confirmados no mês selecionado. O fluxo agora permite edição imediata e usa `closed` como único bloqueio operacional.

## Escopo desta atualização

- remover dependência de confirmação manual do mês;
- normalizar estados operacionais para `confirmed | closed`;
- revisar queries financeiras para não depender de confirmação;
- simplificar frontend removendo CTA/badges/microcopy de confirmação;
- tratar compatibilidade de meses e snapshots legados.

## Tarefa 1 — Revisar contratos e estados mensais

Dependências: nenhuma

- Remover uso operacional de `predicted` e `open`.
- Definir `effective_status = confirmed | closed`.
- Definir `is_edited` como indicador secundário em vez de etapa de workflow.

Validação:

- Novos contratos de leitura/escrita não exigem confirmação manual.

## Tarefa 2 — Ajustar resolvedor e regras de backend

Dependências: Tarefa 1

- Retornar custos válidos sem snapshot como `confirmed` por padrão.
- Permitir edição imediata para mês válido não `closed`.
- Normalizar leitura de estados legados `predicted`/`open` para `confirmed`.

Validação:

- `GET /fixed-costs/monthly` libera edição para mês válido não fechado.
- Nenhuma escrita nova persiste `predicted`/`open`.

## Tarefa 3 — Revisar endpoints e compatibilidade

Dependências: Tarefa 2

- Manter `GET /fixed-costs/monthly`, `PUT /fixed-costs/:id/monthly/:reference_year/:reference_month` e `POST .../close`.
- Decidir se `POST .../confirm` será deprecated/idempotente ou removido em breaking change explícita.

Validação:

- Fluxo principal funciona sem endpoint de confirmação.

## Tarefa 4 — Revisar queries financeiras

Dependências: Tarefa 2

- Garantir `monthly entry > base dinâmica` sem dependência de confirmação manual.
- Revisar `financial/entries`, `financial/report` e `financial/analytics`.
- Confirmar que `closed` não altera valor calculado.

Validação:

- Meses válidos sem snapshot entram nos totais.
- Não há dupla contagem.

## Tarefa 5 — Simplificar frontend

Dependências: Tarefa 1

- Remover CTA e diálogo de confirmação de mês.
- Remover badge/status operacional `Previsto`.
- Remover badge redundante `Confirmado` por linha.
- Manter bloqueio visual de `Fechado`.
- Reduzir mensagens de snapshot/preservação a contexto discreto de legado.

Validação:

- Usuário consegue editar assim que escolhe mês válido.
- Apenas `Fechado` aparece como bloqueio operacional.

## Tarefa 6 — Validar legado

Dependências: Tarefas 2, 3 e 4

- Mapear meses/linhas legados com `predicted` ou `open`.
- Garantir leitura compatível como `confirmed`.
- Garantir que snapshots já existentes continuem visíveis e prevaleçam no mês correspondente.

Validação:

- Cenários legados não quebram leitura, edição nem relatórios.
