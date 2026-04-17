# Spec: Busca por Nome na Lista de Clientes

**ID:** F-CUST-SEARCH
**Status:** Em andamento
**Milestone:** M8

## Contexto

A aba de clientes lista registros paginados, sem filtro por nome. Usuários precisam encontrar rapidamente um cliente específico, e a busca deve funcionar no servidor para respeitar paginação e total.

---

## Requisitos Funcionais

| ID   | Requisito                                                                 | Origem |
|------|----------------------------------------------------------------------------|--------|
| RF01 | Permitir buscar clientes por nome usando correspondência parcial e case-insensitive | Solicitação do usuário |
| RF02 | A busca deve funcionar no servidor, afetando paginação e total retornado   | Solicitação do usuário |
| RF03 | A busca deve ser opcional; sem termo, a listagem mantém o comportamento atual | Estado atual |

---

## Regras de Negócio

| ID   | Regra                                                                 |
|------|------------------------------------------------------------------------|
| RN01 | O filtro por nome deve ignorar diferença de maiúsculas/minúsculas     |
| RN02 | Registros com `deleted_at` permanecem excluídos das listagens          |

---

## Requisitos Não Funcionais

| ID    | Requisito                                                     |
|-------|---------------------------------------------------------------|
| RNF01 | Tempo de resposta deve permanecer compatível com paginação    |
| RNF02 | O comportamento de listagem sem filtro não deve regredir      |

---

## Escopo

### Backend

- `GET /customers` aceita query param opcional `search`
- Repositório aplica `ILIKE '%search%'` no campo `name`

### Frontend

- Campo de busca na aba de clientes
- Debounce para evitar requisições a cada tecla
- Reset de paginação quando o termo muda

---

## Critérios de Aceite

1. Ao digitar um termo, a lista mostra apenas clientes cujo nome contém o termo, independente de caixa.
2. O total e paginação refletem a lista filtrada.
3. Sem termo informado, a lista se comporta exatamente como antes.
4. Clientes com `deleted_at` continuam ausentes dos resultados.
