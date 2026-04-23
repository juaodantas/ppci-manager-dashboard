# Spec: Periodização de Custos Fixos

## Contexto
O módulo financeiro gera lançamentos mensais de custos fixos com base na tabela `fixed_costs`, que hoje não possui datas de vigência. Isso impede controlar início e fim de um custo fixo sem desativá-lo globalmente. Precisamos introduzir `start_date` e `end_date` para permitir periodização, mantendo compatibilidade com o fluxo atual de geração via `generate_series` e com a UI de cadastro/edição.

## Objetivos e não-objetivos

### Objetivos
- Permitir definir período de vigência de um custo fixo com `start_date` e `end_date` (opcional).
- Garantir geração mensal apenas dentro do período definido e respeitando `active=true`.
- Atualizar listagem de `/fixed-costs` para filtrar por período com `date_from`/`date_to` e respeitar `include_inactive`.
- Expor e validar os novos campos na API e na UI.

### Não-objetivos
- Não alterar a lógica de categorias, valores ou cálculo de impostos.
- Não criar novos relatórios ou dashboards.
- Não introduzir novos padrões de persistência ou bibliotecas.

## Requisitos (com IDs)

### Requisitos Funcionais
| ID | Requisito |
|---|---|
| RF01 | Persistir `start_date` e `end_date` em `fixed_costs` (DATE, `end_date` nullable). |
| RF02 | Se `start_date` for nulo no payload, tratar como `created_at::date`. |
| RF03 | `end_date` nulo representa período indeterminado. |
| RF04 | A geração mensal deve incluir meses entre `start_date` e `end_date` (inclusive). |
| RF05 | Se `end_date` for nulo, gerar até o `date_to` do filtro. |
| RF06 | `active=false` sempre exclui o custo fixo da geração mensal. |
| RF07 | `/fixed-costs` deve filtrar por período e incluir itens com `end_date` nulo quando `start_date` estiver dentro do filtro. |
| RF08 | `/fixed-costs` deve respeitar `include_inactive` (default: `false`; quando `true`, incluir inativos) sem ignorar o filtro de período. |
| RF09 | API deve aceitar e retornar `start_date` e `end_date` (YYYY-MM-DD). |
| RF10 | UI deve permitir editar `start_date` e `end_date`, com opção “indeterminado”. |

### Requisitos Não Funcionais
| ID | Requisito |
|---|---|
| RNF01 | Validação de inputs externos deve ocorrer na boundary com Zod. |
| RNF02 | Manter TypeScript estrito sem `any` e sem casts proibidos. |
| RNF03 | Alterações devem preservar comportamento atual quando `start_date`=`created_at::date` e `end_date` nulo. |

## Abordagem técnica e decisões de design
- **Schema**: adicionar `start_date` e `end_date` (DATE) na tabela `fixed_costs`. `end_date` é nullable; `start_date` pode ser nullable no payload, mas persistido com fallback para `created_at::date`.
- **Geração mensal**: manter `generate_series` porém restringir o intervalo por `start_date`/`end_date` e sempre exigir `active=true`. Intervalo é inclusivo nas bordas. Custos inativos nunca entram na geração, independentemente de filtros.
- **Filtro em listagem**: `/fixed-costs` passa a aceitar `date_from`/`date_to` e `include_inactive` (default `false`). Deve retornar custos fixos cujo período de vigência intersecta o intervalo filtrado, incluindo itens indeterminados (end_date nulo) quando `start_date` estiver dentro do filtro. O filtro de período aplica-se tanto para ativos quanto para inativos quando `include_inactive=true`.
- **Quebra de contrato**: a listagem com filtro por período e novos parâmetros (`date_from`/`date_to`) altera comportamento de retorno (potencial breaking change). Documentar e comunicar a mudança de parâmetros/semântica.
- **Validação**: Zod na boundary para datas em formato `YYYY-MM-DD`, `end_date` >= `start_date` quando ambos presentes.
- **UI**: adicionar campos `start_date` e `end_date` no modal. “Indeterminado” desabilita `end_date`; em edição, se `end_date` for nulo, checkbox inicia marcado.

## Estruturas de dados e interfaces

### Modelo de dados (fixo)
`fixed_costs`:
- `id`
- `name`
- `amount`
- `due_day`
- `category`
- `active`
- `start_date` (DATE, nullable no payload; persistido com fallback)
- `end_date` (DATE, nullable)
- `created_at`
- `updated_at`

### Contrato de API (alto nível)
- **POST /fixed-costs**
  - Body: `name`, `amount`, `due_day`, `category`, `active`, `start_date?`, `end_date?`
  - `start_date`/`end_date` no formato `YYYY-MM-DD`
- **PUT/PATCH /fixed-costs/:id**
  - Body inclui `start_date?`, `end_date?`
- **GET /fixed-costs**
- Query: `date_from`, `date_to` (formato `YYYY-MM-DD`), `include_inactive` (boolean, default `false`)
  - Retorna apenas itens cuja vigência intersecta o período. Por padrão retorna apenas `active=true`; quando `include_inactive=true`, inclui também `active=false`.

### UI (modal de custos fixos)
- Campos: `name`, `amount`, `due_day`, `category`, `start_date`, `end_date`.
- `start_date` default = data atual.
- Checkbox “Indeterminado”: quando marcado, `end_date` desabilitado e enviado como `null`.
- Em edição: se `end_date` nulo, checkbox inicia marcado.

## Plano de migração
1. Adicionar colunas `start_date` e `end_date` na tabela `fixed_costs` (DATE).
2. Backfill: `start_date = created_at::date`, `end_date = null` para registros existentes.
3. Atualizar validações da API para aceitar os novos campos.
4. Ajustar geração mensal e totais em relatórios para respeitar período.
5. Atualizar UI para exibir/editar novos campos.

## Edge cases
- `start_date` informado no futuro com `end_date` nulo: geração só ocorre a partir do mês de `start_date`.
- `end_date` anterior a `start_date`: deve ser rejeitado na validação.
- `active=false` sempre exclui, mesmo se período válido.
- `include_inactive=true` inclui inativos, mas nunca ignora o filtro de período.
- Filtro `date_from`/`date_to` com intervalo fechado (inclusive).
- Registros legados sem `start_date` no payload: usar `created_at::date`.

## Impactos em relatórios e listagem
- **Relatórios**: totais mensais devem considerar apenas custos fixos cuja vigência intersecta o período consultado.
- **Listagem**: `/fixed-costs` passa a respeitar filtro por período, retornando somente itens relevantes para o intervalo (incluindo indeterminados com `start_date` dentro do filtro) e respeitando `include_inactive`.

## Critérios de aceite (testáveis)
1. Criar custo fixo sem `start_date` persiste `start_date = created_at::date` e `end_date = null`.
2. Criar/editar com `end_date` nulo marca “indeterminado” e desabilita campo na UI.
3. `GET /fixed-costs` com `date_from`/`date_to` retorna apenas custos fixos cujo período intersecta o intervalo, incluindo os com `end_date` nulo se `start_date` estiver dentro do filtro.
4. `GET /fixed-costs` sem `include_inactive` (default `false`) retorna apenas `active=true`.
5. `GET /fixed-costs` com `include_inactive=true` inclui `active=false`, mas continua filtrando por período.
6. Geração mensal inclui meses entre `start_date` e `end_date` inclusive; se `end_date` nulo, gera até `date_to`.
7. Custos com `active=false` não são gerados nem entram nos totais, independentemente do período ou de `include_inactive`.
8. Payloads com `end_date < start_date` são rejeitados pela validação Zod.
9. Relatórios de totais mensais refletem a periodização corretamente.
