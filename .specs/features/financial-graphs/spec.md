# Spec: Aba de Gráficos Financeiros (MVP)

## Contexto
A aba de finanças atual já consolida dados de receitas, despesas e lançamentos, mas a leitura é majoritariamente tabular e limita a análise de tendência. O MVP desta feature adiciona uma aba de gráficos para comparativo mês a mês e projeção de 12 meses, com foco em identificar gargalos operacionais e melhorar previsibilidade de caixa para usuários de Financeiro e dono.

## Objetivos e não-objetivos

### Objetivos
- Entregar visualização mensal de receita, despesa e saldo no período filtrado usando gráficos.
- Exibir variação M/M para apoiar identificação rápida de desvios.
- Exibir composição de despesas por tipo (`fixed_cost` vs `variable_cost`) em gráfico dedicado.
- Exibir projeção de saldo para 12 meses com cenário único (modelo híbrido) em gráfico dedicado.
- Exibir um gráfico por vez com navegação por setas e dots.
- Reaproveitar dados já existentes no sistema, sem migração obrigatória.

### Não-objetivos
- Não implementar modelos avançados de previsão (ML/ARIMA).
- Não incluir exportação PDF/CSV no MVP.
- Não incluir granularidade semanal/diária no MVP.
- Não reestruturar o módulo financeiro completo.
- Não criar rastreamento de meta de queda de atrasos dentro do sistema.
- Não alterar o contrato do endpoint `GET /financial/analytics`.

## Requisitos (com IDs)

### Requisitos Funcionais
| ID | Requisito |
|---|---|
| RF01 | Criar aba de gráficos dentro do módulo financeiro com filtros por `company_id`, `date_from` e `date_to`. |
| RF02 | Exibir série mensal de `income`, `expense` e `balance` para o período selecionado. |
| RF03 | Exibir variação percentual M/M para receita, despesa e saldo; quando o valor do mês anterior for `0`, o retorno deve ser `null`. |
| RF04 | Exibir composição mensal de despesas separando `fixed_cost` e `variable_cost`. |
| RF05 | Expor endpoint dedicado `GET /financial/analytics` para retornar payload consolidado do MVP. |
| RF06 | O endpoint deve aceitar `company_id`, `date_from`, `date_to` e `horizon_months`; no MVP, `horizon_months` é opcional com default `12` e intervalo permitido `1..12`. |
| RF07 | A projeção deve ser híbrida: receita prevista por pagamentos pendentes (`payments.due_date`) + tendência histórica de receita realizada, definida como média simples dos últimos 3 meses. |
| RF08 | A despesa prevista deve considerar custos fixos vigentes (incluindo juros por competência quando existir) e despesa variável projetada por média simples dos últimos 3 meses de `variable_costs`; sem histórico, usar `0`. |
| RF09 | A UI deve sinalizar meses com saldo projetado negativo. |
| RF10 | Filtros da aba de gráficos devem ser aplicados de forma consistente em todas as consultas exibidas na própria aba. |
| RF11 | O payload deve permitir reconciliação entre totais de gráfico e totais financeiros com divergência máxima de 0,5%. |
| RF12 | A aba de gráficos deve exibir apenas gráficos (sem tabelas). |
| RF13 | A aba deve mostrar um gráfico por vez com navegação por setas e dots. |
| RF14 | Os gráficos devem ser implementados com Recharts. |

### Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF01 | Validar inputs externos na boundary com Zod (`company_id`, datas e `horizon_months`). |
| RNF02 | Garantir TypeScript estrito sem `any`, `@ts-ignore`, `as unknown` ou double cast. |
| RNF03 | Tempo de resposta do endpoint de analytics <= 1.5s (p95) para 12 meses e 1 empresa. |
| RNF04 | Aplicar controle de acesso por empresa no endpoint de analytics, bloqueando a consulta quando `company_id` não estiver no escopo permitido do usuário autenticado. |
| RNF05 | Definir timeout explícito e tratamento de falha para consultas ao banco. |
| RNF06 | Não alterar o contrato do endpoint `GET /financial/analytics`. |

## Abordagem técnica e decisões de design
- **Sem migração obrigatória**: MVP usa tabelas já existentes (`financial_entries`, `fixed_costs`, `fixed_cost_interests`, `variable_costs`, `payments`).
- **Sem novas tabelas no MVP**: a primeira versão calcula analytics sob demanda no backend. Se houver gargalo de performance, materialização fica para versão futura.
- **Endpoint único de analytics**: centraliza regra de cálculo para evitar divergência entre frontend e backend.
- **Granularidade mensal**: toda agregação e projeção em nível de mês.
- **Visualização**: gráficos com Recharts, exibidos um por vez com navegação por setas e dots.
- **Modelo de projeção (MVP)**:
  - Receita prevista = soma de pagamentos pendentes no mês + tendência de receita histórica por média simples dos últimos 3 meses de receita realizada.
  - Despesa prevista = custos fixos vigentes/juros + despesa variável projetada por média simples dos últimos 3 meses de despesa variável; sem histórico de despesa variável, componente variável = `0`.
- **Regra de M/M no MVP**: para `mom_income_pct`, `mom_expense_pct` e `mom_balance_pct`, quando o valor do mês anterior for `0`, retornar `null` (evita divisão por zero e percentuais artificiais).
- **Parâmetro de horizonte**: `horizon_months` com default `12` e validação estrita no intervalo `1..12` para o MVP.
- **Autorização por empresa**: o backend valida o escopo permitido do usuário autenticado e bloqueia requisição quando `company_id` estiver fora do escopo.
- **Risco de contrato**: novo endpoint não quebra os antigos; porém mudanças futuras nas regras de projeção devem ser versionadas e documentadas.

## Estruturas de dados e interfaces

### Contrato de API (alto nível)
- **GET /financial/analytics**
  - Query obrigatória: `company_id`, `date_from`, `date_to`
  - Query opcional: `horizon_months` (default `12`)
  - Resposta (alto nível):
    - `historical_by_month[]`: `month`, `income`, `expense`, `balance`, `mom_income_pct`, `mom_expense_pct`, `mom_balance_pct`
    - `expense_composition_by_month[]`: `month`, `fixed_expense`, `variable_expense`, `fixed_share_pct`, `variable_share_pct`
    - `forecast_by_month[]`: `month`, `forecast_income`, `forecast_expense`, `forecast_balance`, `is_negative_balance`

### Mapeamento UI -> Gráficos
- **Histórico M/M**: `historical_by_month[]` com séries `income`, `expense`, `balance` (linha/área).
- **Composição de despesas**: `expense_composition_by_month[]` com `fixed_expense` e `variable_expense` (barras empilhadas).
- **Projeção 12 meses**: `forecast_by_month[]` com `forecast_income`, `forecast_expense`, `forecast_balance` (linha/área), destacando `is_negative_balance`.

### Fontes de dados do cálculo
- `financial_entries` para histórico de receita realizada.
- `fixed_costs` + `fixed_cost_interests` para despesa fixa e juros por competência.
- `variable_costs` para despesa variável histórica.
- `payments` para componente de receita pendente por `due_date`.

## Edge cases
- Período sem dados históricos deve retornar séries vazias com estrutura válida (sem erro 500).
- `horizon_months` fora de `1..12` deve ser rejeitado na validação; ausência de `horizon_months` deve aplicar default `12`.
- Para cálculo M/M, quando mês anterior for `0`, o campo percentual correspondente deve retornar `null`.
- Pagamentos pendentes sem `due_date` válido não entram na projeção.
- Custos fixos inativos não entram na previsão de despesa.
- Juros de custo fixo inexistentes em determinada competência devem ser tratados como zero.
- Sem histórico suficiente para tendência (menos de 3 meses), usar média simples dos meses históricos disponíveis para receita e despesa variável; na ausência total de histórico de despesa variável, usar `0`.
- Consulta com `company_id` fora do escopo permitido do usuário autenticado deve ser bloqueada com erro de autorização.

## Critérios de aceite (testáveis)
1. A aba de gráficos exibe histórico mensal de receita, despesa e saldo para o filtro selecionado.
2. A aba exibe variação M/M de receita, despesa e saldo com cálculo consistente por mês, retornando `null` quando o mês anterior for `0`.
3. A aba exibe composição de despesa mensal em fixa vs variável.
4. A aba exibe projeção mensal para 12 meses e marca meses com saldo negativo.
5. O endpoint `GET /financial/analytics` valida `horizon_months` no intervalo `1..12`, aplica default `12` quando ausente e rejeita parâmetros inválidos com erro tipado.
6. O endpoint aplica escopo por empresa e bloqueia consulta quando `company_id` não pertence ao escopo permitido do usuário autenticado.
7. Em cenário controlado de projeção, tendência de receita histórica usa média simples dos últimos 3 meses de receita realizada.
8. Em cenário controlado de projeção, despesa variável projetada usa média simples dos últimos 3 meses de despesa variável e retorna `0` quando não houver histórico.
9. Para amostra controlada, diferença entre totais agregados da aba e totais financeiros de referência não supera 0,5%.
10. O tempo de resposta p95 do endpoint de analytics atende <= 1.5s no cenário de referência do MVP.
11. A aba de gráficos não exibe tabelas, apenas gráficos com Recharts.
12. A aba exibe apenas um gráfico por vez com navegação por setas e dots funcionando nos dois sentidos.
13. O payload do endpoint `GET /financial/analytics` permanece inalterado.
