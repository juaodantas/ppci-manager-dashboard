# Spec: Busca por Nome na Lista de Projetos

**ID:** F-PROJ-SEARCH
**Status:** Em andamento
**Milestone:** M8

## Contexto

A lista de projetos já suporta filtros por status e cliente, mas não oferece busca por nome. Usuários precisam localizar projetos rapidamente, mantendo paginação e total coerentes com o filtro.

---

## Requisitos Funcionais

| ID   | Requisito                                                                 | Origem |
|------|----------------------------------------------------------------------------|--------|
| RF01 | Permitir buscar projetos por nome com correspondência parcial e case-insensitive | Solicitação do usuário |
| RF02 | A busca deve funcionar no servidor, afetando paginação e total retornado   | Solicitação do usuário |
| RF03 | A busca deve ser opcional e conviver com filtros de status e cliente        | Estado atual |

---

## Regras de Negócio

| ID   | Regra                                                             |
|------|--------------------------------------------------------------------|
| RN01 | O filtro por nome deve ignorar diferença de maiúsculas/minúsculas |

---

## Requisitos Não Funcionais

| ID    | Requisito                                                     |
|-------|---------------------------------------------------------------|
| RNF01 | Tempo de resposta deve permanecer compatível com paginação    |
| RNF02 | A listagem sem filtro deve manter o comportamento atual       |

---

## Escopo

### Backend

- `GET /projects` aceita query param opcional `search`
- Repositório aplica `ILIKE '%search%'` no campo `name`

### Frontend

- Campo de busca na aba de projetos
- Debounce para evitar requisições a cada tecla
- Reset de paginação quando o termo muda

---

## Critérios de Aceite

1. Ao digitar um termo, a lista mostra apenas projetos cujo nome contém o termo, independente de caixa.
2. O total e paginação refletem a lista filtrada.
3. Sem termo informado, a lista se comporta exatamente como antes.
4. A busca funciona junto com os filtros de status e cliente.
