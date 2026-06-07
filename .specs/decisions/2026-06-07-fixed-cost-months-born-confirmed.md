# Decisão — Custos fixos mensais nascem confirmados

## O que foi decidido

Custos fixos recorrentes dentro da vigência passam a nascer confirmados para o mês selecionado.

Isso implica:

- o usuário pode editar assim que seleciona um mês válido;
- apenas mês `closed` bloqueia edição comum;
- `predicted` e `open` deixam de existir como estados operacionais novos;
- a confirmação manual do mês sai do fluxo principal;
- frontend deve remover CTA, diálogo e microcopy de confirmação.

## Por que

O passo de confirmação manual não agrega valor operacional suficiente para justificar complexidade extra em backend, API, queries financeiras e frontend. Tornar o mês válido imediatamente utilizável simplifica o produto sem perder controle, porque `closed` continua preservando o congelamento final.

## O que foi descartado

- Manter `predicted` como estado operacional antes de editar.
- Manter `open` como estado distinto de `confirmed` no mês.
- Exigir confirmação manual antes de liberar edição.
- Continuar exibindo badges e mensagens de confirmação de mês como parte central da UX.
