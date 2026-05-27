Agent: architect
Rules: AGENTS.md

# Tasks: Aba de Gráficos Financeiros (MVP)

## Task 1 — Fechar contrato do endpoint de analytics
**Depende de:** spec.md aprovado
**Pode rodar em paralelo:** não
**Descrição:** Definir contrato final do `GET /financial/analytics` (queries, validações, shape de resposta e semântica dos campos de projeção).
**Critérios de verificação:**
- Query params e limites de validação documentados (`company_id`, `date_from`, `date_to`, `horizon_months=12`).
- Estrutura de retorno cobre histórico M/M, composição de despesas e projeção.
- Regras de cálculo de projeção ficam explícitas e sem ambiguidade.

## Task 2 — Especificar regra de histórico e M/M no backend
**Depende de:** Task 1
**Pode rodar em paralelo:** sim
**Descrição:** Detalhar agregações mensais de receita/despesa/saldo e cálculo de variação M/M no serviço de analytics.
**Critérios de verificação:**
- Fórmulas de agregação e M/M documentadas para todos os meses da série.
- Tratamento de mês sem base comparativa definido (ex.: `null` para M/M).
- Regra evita dupla contagem entre fontes de despesa/receita.

## Task 3 — Especificar regra de composição de despesas
**Depende de:** Task 1
**Pode rodar em paralelo:** sim
**Descrição:** Definir cálculo mensal de `fixed_cost` vs `variable_cost`, incluindo juros por competência para custos fixos.
**Critérios de verificação:**
- Composição mensal retorna valor absoluto e participação percentual por tipo.
- Juros de custo fixo entram somente na competência correspondente.
- Custos inativos não entram nos agregados de composição.

## Task 4 — Especificar regra de projeção híbrida (12 meses)
**Depende de:** Tasks 1, 2 e 3
**Pode rodar em paralelo:** não
**Descrição:** Definir algoritmo de projeção de receita e despesa para 12 meses com cenário único.
**Critérios de verificação:**
- Receita prevista usa pagamentos pendentes por `due_date` + componente de tendência histórica.
- Despesa prevista usa custos fixos vigentes/juros + componente histórico de variável.
- Saldo projetado mensal e flag de mês negativo (`is_negative_balance`) definidos.

## Task 5 — Especificar UX da aba de gráficos
**Depende de:** Task 1
**Pode rodar em paralelo:** sim
**Descrição:** Definir estrutura de UI da aba, filtros e blocos visuais do MVP sem introduzir escopo extra.
**Critérios de verificação:**
- Layout contempla: comparativo M/M, composição de despesas e projeção 12 meses.
- Filtros por empresa/período aplicam-se de forma uniforme em toda a aba.
- Estados de carregamento, vazio e erro estão definidos.

## Task 6 — Especificar validação, segurança e erro tipado
**Depende de:** Task 1
**Pode rodar em paralelo:** sim
**Descrição:** Definir regras de validação de input com Zod, autorização por empresa e tratamento de falhas com timeout.
**Critérios de verificação:**
- Validação de boundary cobre datas, identificadores e limites de horizonte.
- Regras de autorização por empresa documentadas.
- Timeout e estratégia de erro explícitos para chamadas ao banco.

## Task 7 — Plano de implementação incremental (MVP)
**Depende de:** Tasks 2, 3, 4, 5 e 6
**Pode rodar em paralelo:** não
**Descrição:** Quebrar execução em incrementos mínimos verificáveis sem migração de dados obrigatória.
**Critérios de verificação:**
- Sequência de execução separa backend e frontend com checkpoints de validação.
- Define ordem bloqueante e pontos paralelizáveis entre API/UI.
- Não inclui criação de tabela no plano base do MVP.

## Task 8 — Verificação de aceite e reconciliação
**Depende de:** Task 7
**Pode rodar em paralelo:** não
**Descrição:** Definir checklist final de validação funcional e reconciliação de dados antes de liberar.
**Critérios de verificação:**
- Checklist cobre todos os critérios de aceite da spec.
- Reconciliação financeiro vs analytics com tolerância <= 0,5% documentada.
- Critério de performance p95 <= 1.5s incluído no gate de aprovação.
