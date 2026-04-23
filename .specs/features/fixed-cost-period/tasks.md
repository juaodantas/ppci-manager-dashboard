Agent: tech-lead
Rules: @.ia/RULES.md

# Tasks: Periodização de Custos Fixos

## Task 1 — Modelagem de dados e migração
**Depende de:** —
**Pode rodar em paralelo:** sim
**Descrição:** Definir alteração de schema para `start_date`/`end_date` e plano de backfill.
**Critérios de verificação:**
- Documento de migração descreve colunas novas, nullability e backfill `start_date = created_at::date`, `end_date = null`.
- Riscos de breaking change são apontados na spec.

## Task 2 — Validação de API e contratos
**Depende de:** Task 1
**Pode rodar em paralelo:** sim
**Descrição:** Especificar validação de payloads e contratos de API para novos campos e filtros.
**Critérios de verificação:**
- `start_date`/`end_date` aceitos no formato `YYYY-MM-DD`.
- Regra `end_date >= start_date` documentada como validação obrigatória.
- `GET /fixed-costs` documenta `date_from`, `date_to`, `include_inactive` (default `false`).

## Task 3 — Lógica de listagem com período
**Depende de:** Task 2
**Pode rodar em paralelo:** não
**Descrição:** Definir comportamento de filtro por período na listagem.
**Critérios de verificação:**
- Listagem inclui custos cuja vigência intersecta o intervalo `date_from`/`date_to`.
- `include_inactive=true` inclui inativos sem ignorar o filtro de período.
- `include_inactive` ausente mantém apenas ativos.

## Task 4 — Geração mensal com periodização
**Depende de:** Task 1
**Pode rodar em paralelo:** sim
**Descrição:** Especificar ajuste na geração mensal para respeitar período e `active=true`.
**Critérios de verificação:**
- Geração mensal inclui meses entre `start_date` e `end_date` (inclusive).
- `end_date` nulo gera até `date_to` do filtro.
- Custos inativos nunca entram na geração, independentemente de `include_inactive`.

## Task 5 — UI de cadastro/edição
**Depende de:** Task 2
**Pode rodar em paralelo:** sim
**Descrição:** Definir ajustes no modal para editar `start_date` e `end_date` com opção indeterminado.
**Critérios de verificação:**
- Campo `start_date` possui default da data atual.
- Checkbox “Indeterminado” envia `end_date = null` e desabilita o input.
- Edição de registro com `end_date` nulo inicia com checkbox marcado.

## Task 6 — Consistência e aceite
**Depende de:** Tasks 2–5
**Pode rodar em paralelo:** não
**Descrição:** Revisar consistência entre requisitos, abordagem, contratos e critérios de aceite.
**Critérios de verificação:**
- Critérios de aceite cobrem filtro por período, `include_inactive` e exclusão de inativos na geração mensal.
- Não há contradições entre requisitos funcionais, abordagem e critérios de aceite.
