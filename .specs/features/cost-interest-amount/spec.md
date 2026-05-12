# Spec: Juros em Custos (Modelo Misto)

## Contexto
O módulo financeiro já possui custos fixos (`fixed_costs`) e variáveis (`variable_costs`) com valor principal (`amount`).

Foi definido o seguinte comportamento de juros:
- **Custo variável:** juros simples **1:1** no próprio registro do custo variável.
- **Custo fixo:** juros por competência mensal **N:1** (vários registros de juros para o mesmo custo fixo), podendo existir competências com juros e competências sem juros; quando não houver registro na competência, considerar juros `0`.

No frontend, o usuário deve informar juros como **valor de acréscimo pago**.

## Objetivos e não-objetivos

### Objetivos
- Permitir registrar juros em custos variáveis como valor adicional direto no lançamento.
- Permitir registrar juros em custos fixos com valor adicional e competência (mês/ano de pagamento).
- Garantir que relatórios e listagens usem `total = amount + juros aplicável`.
- Manter compatibilidade com dados legados com fallback para `0` quando não houver juros.

### Não-objetivos
- Não implementar fluxo completo de contas a pagar (status, conciliação, baixa financeira).
- Não separar tipos de encargo (juros, multa, correção) nesta versão.
- Não permitir múltiplos valores de juros para o mesmo custo fixo na mesma competência mensal.

## Requisitos (com IDs)

### Requisitos Funcionais
| ID | Requisito |
|---|---|
| RF01 | Adicionar `interest_amount` em `variable_costs` (DECIMAL(10,2), NOT NULL, default 0, check >= 0). |
| RF02 | Criar tabela `fixed_cost_interests` para juros mensais de custo fixo com colunas `id`, `fixed_cost_id`, `reference_year`, `reference_month`, `interest_amount`, `created_at`, `updated_at`. |
| RF03 | `fixed_cost_interests.interest_amount` deve ser DECIMAL(10,2), NOT NULL, check >= 0. |
| RF04 | Deve existir constraint de unicidade em `fixed_cost_interests (fixed_cost_id, reference_year, reference_month)`. |
| RF05 | API de criação/edição de custo variável deve aceitar `interest_amount` opcional. |
| RF06 | API de leitura de custo variável deve retornar `interest_amount`. |
| RF07 | API deve permitir CRUD de juros mensais de custo fixo (create, update, delete, list). |
| RF08 | Ao criar/editar juros mensal de custo fixo, `reference_month` deve estar no intervalo 1..12 e a competência deve estar dentro do intervalo em que o custo fixo está ativo/salvo. |
| RF09 | No relatório financeiro (`entries` e `report`), custo variável deve usar `vc.amount + vc.interest_amount`. |
| RF10 | No relatório financeiro (`entries` e `report`), custo fixo deve usar `fc.amount + juros_da_competencia`; na ausência de juros para a competência, usar `0`. O mesmo custo fixo pode ter competências com juros e competências sem juros. |
| RF11 | UI de custo variável deve exibir campo `Juros` para o usuário informar o valor adicional pago na conta. |
| RF12 | UI de custo fixo deve permitir informar `valor adicional de juros` e `competência (mês/ano de pagamento)` para registrar juros por competência. |
| RF13 | UI deve exibir o valor total do item já com juros aplicável nos contextos de listagem e relatório. |
| RF14 | Registros legados sem juros devem permanecer válidos com comportamento equivalente a juros `0`. |
| RF15 | Em atualização de juros fixo, a competência pode ser alterada no mesmo registro; se a competência destino já existir para o mesmo custo fixo, retornar conflito (`409`). |
| RF16 | Na listagem de custos fixos da UI, o total com juros deve considerar a competência filtrada; sem filtro explícito, considerar competência atual. |

### Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF01 | Validação de payload na boundary com Zod para todos os campos de juros (`interest_amount >= 0`, competência válida). |
| RNF02 | Não usar `any`, `@ts-ignore`, `as unknown` ou double cast. |
| RNF03 | Migrações devem ser backward-compatible e sem perda de dados. |

## Abordagem técnica e decisões de design
- **Modelo misto deliberado:** variável com juros simples no próprio registro; fixo com juros mensal em entidade dedicada.
- **Semântica de frontend (variável):** usuário adiciona diretamente o valor pago a mais em juros naquele custo.
- **Semântica de frontend (fixo):** usuário informa valor adicional e a competência (mês/ano de pagamento) em que o juros foi pago.
- **Cálculo padrão:** todo cálculo financeiro usa `total_amount = amount + juros aplicável` conforme tipo de custo.
- **Integridade para fixo:** unicidade por custo fixo e competência impede duplicidade de juros no mesmo mês; ausência de registro em uma competência implica juros `0` nessa competência.

## Definições operacionais (resolução de pontos em aberto)
- **Vigência por competência mensal (inclusiva):** mês de `start_date` e mês de `end_date` são válidos. A competência é aceita quando há interseção entre o mês informado e o intervalo `[start_date, end_date]`; `end_date = null` significa sem limite superior.
- **Atualização de competência de juros fixo:** `PUT /fixed-costs/:id/interests/:interestId` atualiza o mesmo registro (não cria outro). Se a competência destino já estiver ocupada para o mesmo custo fixo, a API retorna conflito de unicidade (`409`).
- **Listagem de custos fixos na UI:** quando houver filtro de competência na tela, usar essa competência (mês/ano de pagamento) para compor total com juros; sem filtro explícito, usar competência atual.
- **Contrato de `financial/entries`:** manter `amount` totalizado como padrão (compatível com contrato atual). Exposição separada de principal/juros fica fora de escopo desta versão.

## Limitações conhecidas (aceitas nesta versão)
- Não há separação entre tipos de encargo (apenas um campo de juros).
- Não há workflow de pagamento/baixa; juros apenas compõe despesa.
- Juros de custo fixo é mensal por competência, mas não representa parcelamento de juros.

## Estruturas de dados e interfaces

### Banco de dados
- `variable_costs`
  - adicionar `interest_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (interest_amount >= 0)`
- `fixed_cost_interests`
  - `id` (PK)
  - `fixed_cost_id` (FK -> `fixed_costs.id`)
  - `reference_year INT NOT NULL`
  - `reference_month INT NOT NULL CHECK (reference_month BETWEEN 1 AND 12)`
  - `interest_amount DECIMAL(10,2) NOT NULL CHECK (interest_amount >= 0)`
  - `created_at`, `updated_at`
  - `UNIQUE (fixed_cost_id, reference_year, reference_month)`

### API (alto nível)
- `POST /variable-costs` e `PUT /variable-costs/:id`
  - aceitar `interest_amount?: number`
- `GET /variable-costs`
  - retornar `interest_amount`
- `POST /fixed-costs/:id/interests`
  - aceitar `reference_year`, `reference_month`, `interest_amount`
- `PUT /fixed-costs/:id/interests/:interestId`
  - aceitar atualização de competência e/ou valor de juros
- `DELETE /fixed-costs/:id/interests/:interestId`
- `GET /fixed-costs/:id/interests`
  - listar juros por competência (com filtro opcional por ano)

### UI Financeiro
- **Custo variável:** input numérico `Juros` (min 0, step 0.01) para valor adicional pago.
- **Custo fixo:** formulário/ação para registrar juros com:
  - input numérico `Valor adicional de juros` (min 0, step 0.01)
  - seletor de `competência (mês/ano de pagamento)`
  - validação para permitir apenas competência dentro do período em que o custo fixo está salvo/ativo
- **Listagens e relatório:** exibir total com juros aplicado; quando útil, exibir juros em coluna separada.

## Impactos por camada
- **Migrations:** adicionar coluna em `variable_costs` e criar tabela `fixed_cost_interests` com constraints e índices.
- **Backend entidades/repositórios:** mapear `interest_amount` em variável e relacionamento de juros mensais em fixo.
- **Validação:** atualizar schemas Zod de create/update para variável e CRUD de juros de fixo.
- **Relatório financeiro:** ajustar queries para cálculo por tipo (variável 1:1, fixo por competência mensal).
- **Frontend:** atualizar DTOs, formulários e telas de listagem/relatório com os novos campos e fluxos.

## Plano de migração
1. Criar migration com `interest_amount` em `variable_costs` (default `0`, check `>= 0`).
2. Criar migration da tabela `fixed_cost_interests` com FK, checks e `UNIQUE` por competência.
3. Atualizar entidades/repositórios e contratos de API.
4. Atualizar validação Zod para payloads de juros (variável e fixo).
5. Atualizar queries de `financial/entries` e `financial/report`.
6. Atualizar frontend para entrada de juros conforme fluxo por tipo de custo.

## Edge cases
- `interest_amount` ausente em custo variável: persistir default `0`.
- `interest_amount = 0`: comportamento idêntico ao atual.
- `interest_amount < 0`: rejeitar com erro de validação.
- Competência de juros fixo fora de `1..12`: rejeitar com erro de validação.
- Tentativa de duplicar juros no mesmo `fixed_cost_id + month + year`: rejeitar por unicidade.
- Em `PUT` de juros fixo, troca de competência para mês já ocupado: rejeitar com `409` sem criar novo registro.
- Competência fora do intervalo em que o custo fixo está salvo/ativo: rejeitar com erro de domínio.
- Para o mesmo custo fixo, competência A pode ter `interest_amount > 0` e competência B pode não ter registro; na competência B, o cálculo deve considerar juros `0`.
- Registros legados sem juros: considerar juros `0`.

## Critérios de aceite (testáveis)
1. Ao criar custo variável com `interest_amount=50`, API retorna `interest_amount=50`.
2. Ao criar custo variável sem `interest_amount`, API retorna `interest_amount=0`.
3. Payload de custo variável com `interest_amount=-1` é rejeitado.
4. Ao criar juros mensal para custo fixo (`reference_year=2026`, `reference_month=5`, `interest_amount=120`), API retorna o registro criado.
5. Tentativa de criar segundo juros para o mesmo custo fixo e mesma competência é rejeitada.
6. Tentativa de criar juros de custo fixo fora do período em que o custo está salvo/ativo é rejeitada.
7. Em `financial/entries`, custo variável usa `amount + interest_amount`.
8. Em `financial/entries`, custo fixo usa `amount + juros da competência`; sem juros no mês, soma `0`.
9. Para o mesmo custo fixo, existindo juros na competência `2026-05` e ausência de juros em `2026-06`, `financial/entries` deve calcular `amount + juros` em maio e `amount + 0` em junho.
10. Em `financial/report`, totais de despesa refletem corretamente os juros de variável e fixo conforme regras acima.
11. UI permite registrar juros em variável como acréscimo direto.
12. UI permite registrar juros em fixo com valor e competência (mês/ano de pagamento).
13. Ao editar juros fixo e alterar competência para mês/ano livre, o mesmo registro é atualizado com sucesso.
14. Ao editar juros fixo e alterar competência para mês/ano já ocupado no mesmo custo fixo, API retorna `409`.

## Riscos e evolução recomendada
- Risco funcional: validar “intervalo em que o custo fixo está salvo/ativo” depende de definição consistente de período no domínio (datas de início/fim).
- Evolução futura recomendada: suportar tipos de encargo (juros, multa, correção) em `fixed_cost_interests` e `variable_costs` sem quebrar o contrato atual.
