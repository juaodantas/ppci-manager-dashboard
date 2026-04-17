# Spec: Status "Concluido - Pagamento Pendente" em Projetos

**ID:** F-PROJ-STATUS-PAYMENT-PENDING
**Status:** Planejado
**Milestone:** M8

## Contexto

Usuarios precisam de um status adicional para facilitar o mapeamento de projetos concluidos com pagamento pendente, sem comportamento especial por enquanto.

---

## Requisitos Funcionais

| ID   | Requisito                                                                 | Origem |
|------|----------------------------------------------------------------------------|--------|
| RF01 | Incluir o status "Concluido - Pagamento Pendente" como opcao valida       | Solicitação do usuário |
| RF02 | Exibir o status em listas, detalhes e PDF de contrato                      | Solicitação do usuário |
| RF03 | Permitir filtrar projetos por esse status                                  | Solicitação do usuário |

---

## Regras de Negocio

| ID   | Regra                                                                            |
|------|----------------------------------------------------------------------------------|
| RN01 | O status nao possui comportamento especial nem regras adicionais no momento     |

---

## Requisitos Nao Funcionais

| ID    | Requisito                                                     |
|-------|---------------------------------------------------------------|
| RNF01 | Manter compatibilidade com os status atuais                   |

---

## Escopo

### Backend

- Validacao de status aceita o novo valor
- Persistencia permite o novo status

### Frontend

- Label, cor e opcao de filtro para o novo status
- Exibicao correta em lista e detalhe
- Exibicao correta no PDF do contrato

---

## Criterios de Aceite

1. O novo status aparece no filtro e pode ser selecionado.
2. O status e exibido com label correto na lista e no detalhe do projeto.
3. O PDF do contrato mostra o label correto.
4. Nenhuma regra especial e aplicada alem da exibicao e persistencia.
