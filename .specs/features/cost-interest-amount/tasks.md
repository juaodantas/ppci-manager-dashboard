Agent: explore
Rules: /home/joao/.config/opencode/AGENTS.md

# Tasks: Juros em Custos (Modelo Misto)

**Feature:** cost-interest-amount  
**Spec:** `.specs/features/cost-interest-amount/spec.md`  
**Status:** Planejado

## Convenção de dependências e paralelismo
- `Depende de`: IDs bloqueantes.
- `Paralelo`: `sim` quando pode executar sem depender de outra task em andamento.

---

## T-01 — Migration: adicionar `interest_amount` em `variable_costs`
- **Depende de:** —
- **Paralelo:** sim
- **Descrição curta:** Criar migration backward-compatible para juros 1:1 em custos variáveis.
- **Arquivos-alvo prováveis:**
  - `supabase/migrations/<timestamp>_add_interest_amount_to_variable_costs.sql`
- **Critério de pronto (verificável):**
  - Coluna `variable_costs.interest_amount DECIMAL(10,2) NOT NULL DEFAULT 0` criada.
  - Constraint `CHECK (interest_amount >= 0)` criada.
  - Registros legados permanecem válidos com valor efetivo `0`.

## T-02 — Migration: criar tabela `fixed_cost_interests`
- **Depende de:** —
- **Paralelo:** sim
- **Descrição curta:** Criar entidade de juros mensal N:1 para custos fixos com integridade por competência.
- **Arquivos-alvo prováveis:**
  - `supabase/migrations/<timestamp>_create_fixed_cost_interests.sql`
- **Critério de pronto (verificável):**
  - Tabela `fixed_cost_interests` criada com colunas da spec (`id`, `fixed_cost_id`, `reference_year`, `reference_month`, `interest_amount`, `created_at`, `updated_at`).
  - FK para `fixed_costs(id)` criada.
  - Constraints de `reference_month BETWEEN 1 AND 12` e `interest_amount >= 0` criadas.
  - Unicidade `UNIQUE (fixed_cost_id, reference_year, reference_month)` criada.

## T-03 — Shared domain: atualizar entidades exportadas
- **Depende de:** T-01, T-02
- **Paralelo:** sim
- **Descrição curta:** Atualizar tipos compartilhados para refletir juros em variável e nova entidade de juros fixo.
- **Arquivos-alvo prováveis:**
  - `supabase/functions/_shared/domain/entities/variable-cost.entity.ts`
  - `supabase/functions/_shared/domain/entities/fixed-cost.entity.ts`
  - `supabase/functions/_shared/domain/entities/financial-entry.entity.ts` (se necessário para novo `source_type`)
  - `supabase/functions/_shared/domain/index.ts`
- **Critério de pronto (verificável):**
  - `VariableCost` expõe `interest_amount`.
  - Existe tipo/interface para `FixedCostInterest` exportado no barrel.
  - Tipos consumidos por backend e frontend compilam sem regressão.

## T-04 — Backend validation (Zod): juros variável e CRUD de juros fixo
- **Depende de:** T-03
- **Paralelo:** sim
- **Descrição curta:** Atualizar schemas de payload para aceitar/validar juros com regras da spec.
- **Arquivos-alvo prováveis:**
  - `supabase/functions/api/validation/schemas.ts`
- **Critério de pronto (verificável):**
  - `createVariableCostSchema` e `updateVariableCostSchema` aceitam `interest_amount` opcional com `min(0)`.
  - Schemas para create/update/list de juros fixo validam `reference_year`, `reference_month (1..12)` e `interest_amount >= 0`.
  - Tipos inferidos (`z.infer`) para novos DTOs disponíveis.

## T-05 — Backend repository: `variable_costs` com `interest_amount`
- **Depende de:** T-01, T-03
- **Paralelo:** sim
- **Descrição curta:** Ajustar mapper, INSERT e UPDATE de custo variável para persistir e retornar juros.
- **Arquivos-alvo prováveis:**
  - `supabase/functions/api/repositories/variable-cost.repository.ts`
  - `supabase/functions/api/use-cases/variable-cost/create-variable-cost.ts`
  - `supabase/functions/api/use-cases/variable-cost/update-variable-cost.ts`
- **Critério de pronto (verificável):**
  - `POST/PUT/GET /variable-costs` incluem `interest_amount` no contrato de resposta.
  - `interest_amount` ausente em create persiste como `0`.

## T-06 — Backend repository/use-cases: CRUD de `fixed_cost_interests`
- **Depende de:** T-02, T-03, T-04
- **Paralelo:** não
- **Descrição curta:** Implementar camada de acesso e regras de domínio para juros mensais de custo fixo.
- **Arquivos-alvo prováveis:**
  - `supabase/functions/api/repositories/fixed-cost-interest.repository.ts` (novo)
  - `supabase/functions/api/use-cases/fixed-cost-interest/create-fixed-cost-interest.ts` (novo)
  - `supabase/functions/api/use-cases/fixed-cost-interest/update-fixed-cost-interest.ts` (novo)
  - `supabase/functions/api/use-cases/fixed-cost-interest/delete-fixed-cost-interest.ts` (novo)
  - `supabase/functions/api/use-cases/fixed-cost-interest/get-fixed-cost-interests.ts` (novo)
  - `supabase/functions/api/repositories/fixed-cost.repository.ts` (consulta de vigência para validação de competência)
- **Critério de pronto (verificável):**
  - CRUD funcional para juros fixos por `fixed_cost_id`.
  - Criação/edição rejeita competência fora de vigência do custo fixo.
  - Duplicidade da mesma competência retorna erro tratável (mapeado de constraint única).

## T-07 — Backend routes: endpoints de juros fixo
- **Depende de:** T-06
- **Paralelo:** não
- **Descrição curta:** Expor endpoints aninhados em `fixed-costs` com validação e tratamento de erro padrão Hono.
- **Arquivos-alvo prováveis:**
  - `supabase/functions/api/routes/fixed-costs.ts`
  - `supabase/functions/api/index.ts` (apenas se houver extração para sub-route dedicada)
- **Critério de pronto (verificável):**
  - Endpoints previstos na spec disponíveis:
    - `GET /fixed-costs/:id/interests`
    - `POST /fixed-costs/:id/interests`
    - `PUT /fixed-costs/:id/interests/:interestId`
    - `DELETE /fixed-costs/:id/interests/:interestId`
  - Payload inválido retorna 400 via `validateBody`.

## T-08 — Backend financial queries: incluir juros em `entries`
- **Depende de:** T-01, T-02
- **Paralelo:** sim
- **Descrição curta:** Ajustar query de `findEntries` para totalizar despesas com juros por tipo.
- **Arquivos-alvo prováveis:**
  - `supabase/functions/api/repositories/financial.repository.ts`
- **Critério de pronto (verificável):**
  - Para `variable_cost`, valor lançado = `vc.amount + vc.interest_amount`.
  - Para `fixed_cost`, valor lançado = `fc.amount + juros_da_competencia` (fallback `0` quando não houver).
  - Compatível com filtros existentes (`date_from/date_to/company_id/type`).

## T-09 — Backend financial queries: incluir juros em `report`
- **Depende de:** T-08
- **Paralelo:** não
- **Descrição curta:** Replicar regra de juros no cálculo consolidado e mensal do relatório.
- **Arquivos-alvo prováveis:**
  - `supabase/functions/api/repositories/financial.repository.ts`
- **Critério de pronto (verificável):**
  - `total_expense`, `balance` e `entries_by_month` refletem os mesmos totais de juros da regra de `entries`.
  - Sem juros cadastrado, comportamento idêntico ao atual.

## T-10 — Frontend contracts + infraestrutura HTTP
- **Depende de:** T-03, T-05, T-07
- **Paralelo:** sim
- **Descrição curta:** Atualizar DTOs/repositórios do web app para juros variável e CRUD de juros fixo.
- **Arquivos-alvo prováveis:**
  - `apps/web/src/domain/repositories/variable-cost.repository.ts`
  - `apps/web/src/domain/repositories/fixed-cost.repository.ts`
  - `apps/web/src/infrastructure/http/variable-cost.http-repository.ts`
  - `apps/web/src/infrastructure/http/fixed-cost.http-repository.ts`
  - `apps/web/src/application/use-cases/fixed-cost/fixed-cost.use-cases.ts`
  - `apps/web/src/infrastructure/di/container.ts`
  - `apps/web/src/presentation/hooks/useFixedCosts.ts`
  - `apps/web/src/presentation/hooks/useVariableCosts.ts`
- **Critério de pronto (verificável):**
  - DTO de variável aceita `interest_amount`.
  - Cliente HTTP de custo fixo consegue listar/criar/editar/excluir juros mensais.
  - Hooks invalidam queries financeiras ao mutar juros fixos (coerência com padrão já usado em variável).

## T-11 — Frontend UI: formulário e tabela de custo variável
- **Depende de:** T-10
- **Paralelo:** sim
- **Descrição curta:** Adicionar campo `Juros` no modal de variável e exibir total com juros na listagem.
- **Arquivos-alvo prováveis:**
  - `apps/web/src/app/(dashboard)/financial/page.tsx`
- **Critério de pronto (verificável):**
  - Formulário de variável possui input numérico `Juros` (`min=0`, `step=0.01`).
  - Edição preenche `interest_amount` existente.
  - Tabela exibe valor total com juros (e opcionalmente coluna separada).

## T-12 — Frontend UI: gestão de juros mensais em custo fixo
- **Depende de:** T-10
- **Paralelo:** sim
- **Descrição curta:** Adicionar fluxo para registrar/editar/excluir juros por competência no contexto de custo fixo.
- **Arquivos-alvo prováveis:**
  - `apps/web/src/app/(dashboard)/financial/page.tsx`
  - componentes auxiliares em `apps/web/src/presentation/components/` (se extração for necessária)
- **Critério de pronto (verificável):**
  - UI permite informar `valor adicional de juros` + `competência (mês/ano de pagamento)` para um custo fixo.
  - UI bloqueia envio inválido (mês fora de 1..12) e propaga erro de competência fora de vigência.
  - Usuário consegue listar e remover juros cadastrados por custo fixo.

## T-13 — Frontend financeiro: listagens/relatório com totais finais
- **Depende de:** T-08, T-09, T-11, T-12
- **Paralelo:** não
- **Descrição curta:** Garantir que cards, tabela de lançamentos e contexto de custos exibam números consistentes com regra de juros.
- **Arquivos-alvo prováveis:**
  - `apps/web/src/app/(dashboard)/financial/page.tsx`
  - `apps/web/src/presentation/hooks/useFinancial.ts` (se ajuste de contrato for necessário)
- **Critério de pronto (verificável):**
  - Valores de despesas no dashboard batem com backend para cenários com e sem juros.
  - Não há divergência entre listagem de custos e lançamentos/relatório no mesmo período.

## T-14 — Validação final de aceite da feature
- **Depende de:** T-05, T-07, T-09, T-13
- **Paralelo:** não
- **Descrição curta:** Executar checklist dos critérios de aceite da spec e registrar pendências.
- **Arquivos-alvo prováveis:**
  - `.specs/features/cost-interest-amount/spec.md` (referência)
  - `.specs/features/cost-interest-amount/tasks.md` (status/checklist)
- **Critério de pronto (verificável):**
  - RFs e critérios testáveis 1..14 da spec cobertos por validação manual/funcional.
  - Cenário do mesmo custo fixo com mês com juros e mês sem juros validado (`amount + juros` vs `amount + 0`).
  - Pendências e desvios (se houver) documentados com decisão explícita.

---

## Riscos e bloqueios
- O backend atual usa mapeadores com `any` em alguns repositórios (`variable-cost.repository.ts`, `financial.repository.ts`); mudar esse padrão pode virar escopo paralelo não planejado.
- A validação “competência dentro do período em que o custo fixo está ativo/salvo” depende da interpretação oficial de bordas de vigência (`start_date`, `end_date`, inclusividade).
- Queries financeiras já são complexas com `generate_series`; join de juros por competência pode impactar performance sem índices adequados.
- Há risco de divergência de total entre tabela de custos e relatório se frontend continuar exibindo `amount` puro em alguns pontos.

## Perguntas abertas
1. A competência válida para juros fixo deve considerar `start_date` e `end_date` inclusivos no mês (ex.: `start_date=2026-05-20` permite competência 05/2026)?
2. Em `PUT /fixed-costs/:id/interests/:interestId`, deve ser permitido trocar a competência para um mês já ocupado (esperando erro de unicidade) ou a UI deve impedir antes?
3. A listagem de custos fixos precisa mostrar o total com juros de uma competência selecionada/filtro atual, ou apenas no relatório e lançamentos financeiros?
4. Preferência de UX para juros fixos na tela financeira: modal por linha de custo fixo, drawer dedicado, ou seção expandível inline?
5. É necessário expor `interest_amount` separado nas respostas de `financial/entries`, ou apenas `amount` final totalizado atende o contrato esperado?
