# UX clarity — Gestão mensal de custos fixos

## Contexto

Com a nova regra de negócio, custos fixos recorrentes válidos nascem confirmados para o mês selecionado. Isso muda a UX da tela mensal: o usuário não precisa mais revisar e confirmar o mês antes de editar. A interface deve refletir essa simplificação e remover ruídos visuais associados ao fluxo anterior.

## Goals

- Permitir percepção imediata de que o mês válido já está pronto para edição.
- Remover CTAs, badges e microcopy de confirmação de mês.
- Reduzir uso de mensagens de snapshot/preservação a casos legados realmente necessários.
- Manter `Fechado` como único bloqueio visual e operacional de edição.
- Preservar a distinção entre `Gestão mensal` e `Cadastro recorrente`.

## Non-goals

- Reintroduzir etapa manual de confirmação.
- Exibir `confirmed` como badge obrigatório em todas as linhas.
- Tratar snapshot legado como fluxo principal da tela.
- Alterar a regra de cálculo mensal.

## Technical approach and design decisions

### 1. Edição imediata é o estado padrão

Ao entrar em um mês válido:

- a ação de editar deve estar disponível;
- a UI não deve pedir confirmação prévia;
- o usuário não deve ver CTA como `Confirmar mês`, `Revisar e confirmar` ou equivalentes.

### 2. Status operacionais visíveis são simplificados

Na UI principal:

- `Fechado` continua visível e bloqueante;
- `Previsto` deixa de ser status operacional de linha para custos recorrentes válidos;
- `Confirmado` deixa de ser badge obrigatório por linha, porque vira default implícito;
- `Editado neste mês` pode existir como indicador secundário se o produto achar útil mostrar override mensal.

### 3. Copy que deve sair

Remover ou reescrever textos como:

- `Confirmar mês`
- `Revise os custos e confirme este mês`
- `Mês ainda não confirmado`
- `Valor previsto aguardando confirmação`
- mensagens longas de preservação/snapshot como explicação principal da linha

### 4. Copy recomendada

- `Mês selecionado: Junho/2026`
- `Editar este mês`
- `Esta alteração vale apenas para o mês selecionado.`
- `Mês fechado para edição`
- para legado, somente quando necessário: `Valor já salvo anteriormente neste mês.`

### 5. Snapshots legados viram contexto discreto

Se um snapshot legado existir para custo hoje fora da vigência ou inativo:

- a linha continua visível;
- a explicação deve ser curta;
- não usar banner, callout ou mensagem dominante se a linha já estiver compreensível sem isso.

## Data structures or interfaces involved

```text
FixedCostMonthlyLinePresentation
- effective_status: confirmed | closed
- is_edited: boolean
- is_editable: boolean
- legacy_context?: out_of_range_snapshot | inactive_snapshot
```

Mapeamentos de apresentação recomendados:

- `effective_status = closed` -> badge/bloqueio visível
- `is_edited = true` -> label secundário opcional `Editado neste mês`
- `legacy_context != null` -> helper curto e discreto

## Acceptance criteria

- AC-UX-001: O frontend não exibe CTA ou diálogo de confirmação de mês.
- AC-UX-002: Custos recorrentes válidos do mês aparecem editáveis sem confirmação prévia.
- AC-UX-003: `Previsto` não aparece como estado operacional de linha para custo recorrente válido ainda não editado.
- AC-UX-004: `Confirmado` não aparece como badge redundante em todas as linhas por padrão.
- AC-UX-005: `Fechado` continua visível e bloqueia edição.
- AC-UX-006: Mensagens de snapshot/preservação aparecem apenas quando necessárias para explicar caso legado.
- AC-UX-007: A distinção entre `Gestão mensal` e `Cadastro recorrente` permanece clara.
- AC-UX-008: O modal/formulário mensal continua informando que a alteração vale apenas para o mês selecionado.

## Validation commands

- `npm run lint --workspace @manager/web`
- `npm run test --workspace @manager/web`
- `npm run build --workspace @manager/web`

## Open questions that need clarification

1. O produto quer manter o indicador secundário `Editado neste mês` ou remover qualquer status de linha não bloqueante?
2. O endpoint legado de confirmação ficará escondido apenas da UI ou será removido da API no mesmo ciclo?
