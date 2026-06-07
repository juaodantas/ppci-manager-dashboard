# PRD — Gestão mensal de custos fixos por mês

## 1. Executive Summary

### Problem Statement

O fluxo mensal atual ainda pressupõe confirmação manual do mês e diferenciações como `predicted`/`open`/`confirmed` que já não agregam valor operacional. Isso aumenta complexidade em backend, API, queries financeiras e frontend.

### Proposed Solution

Simplificar a feature para que custos fixos recorrentes dentro da vigência nasçam confirmados no mês selecionado, com edição liberada imediatamente. Apenas mês `closed` bloqueia edição. Ação visual/manual de confirmar mês sai do fluxo principal.

### Success Criteria

- Mês válido já permite edição sem confirmação manual.
- Apenas `closed` bloqueia edição.
- Relatórios e analytics usam a mesma regra mensal sem depender de confirmação.
- Frontend remove CTA e microcopy de confirmação e reduz mensagens de snapshot a contexto legado.

## 2. User Experience & Functionality

### User Stories

- Como gestor financeiro, quero selecionar um mês válido e editar custos fixos imediatamente.
- Como gestor financeiro, quero fechar um mês quando quiser congelar os valores finais.
- Como usuário de relatórios, quero ver totais corretos mesmo quando o mês nunca passou por uma confirmação manual.

### Acceptance Criteria

- A aba `Custos Fixos` abre no mês atual e não exibe filtro global de período.
- Custos válidos do mês aparecem imediatamente editáveis.
- Não existe ação de `Confirmar mês` no fluxo principal.
- Apenas `Fechado` bloqueia edição comum.
- Override mensal continua sem alterar cadastro recorrente.
- Gráficos, lançamentos e relatórios usam `monthly entry > base dinâmica`.

### Non-Goals

- Criar materialização automática de todos os meses.
- Inserir custos fixos em `financial_entries` automaticamente.
- Reabrir mês fechado.
- Manter UX centrada em status `predicted`/`open`.

## 3. Technical Specifications

### Architecture Overview

- `fixed_costs`: cadastro recorrente/base.
- `fixed_cost_monthly_entries`: override/snapshot mensal quando houver edição ou legado.
- resolvedor mensal: calcula valor efetivo do mês e devolve estado operacional `confirmed` ou `closed`.

### Integration Points

#### API

- `GET /fixed-costs/monthly?reference_year=YYYY&reference_month=MM&company_id=<opcional>`
- `PUT /fixed-costs/:id/monthly/:reference_year/:reference_month`
- `POST /fixed-costs/monthly/:reference_year/:reference_month/close`
- `POST /fixed-costs/monthly/:reference_year/:reference_month/confirm` apenas como legado/depreciação, se necessário

#### Banco de dados

- `fixed_cost_monthly_entries` continua como persistência do override.
- `fixed_cost_months`, se existir, passa a ter foco em `closed`; confirmação pode ser inferida como default.

#### Frontend

- remover CTA de confirmação;
- manter separação `Gestão mensal` vs `Cadastro recorrente`;
- permitir edição imediata do mês válido;
- dar destaque operacional apenas para `Fechado`.

## 4. Risks & Roadmap

### Technical Risks

- Consumidores legados podem depender de `predicted`, `open` ou endpoint de confirmação.
- Queries financeiras podem filtrar incorretamente por confirmação e excluir meses válidos sem snapshot.
- UX pode continuar poluída se badges/status antigos não forem removidos de forma consistente.

### Recommended Rollout

1. Normalizar contrato de leitura para `confirmed | closed`.
2. Ajustar queries financeiras para independência de confirmação manual.
3. Simplificar frontend removendo confirmação de mês e badges redundantes.
4. Tratar depreciação ou remoção do endpoint legado de confirmação.
