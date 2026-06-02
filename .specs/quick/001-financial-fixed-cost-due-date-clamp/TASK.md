Agent: implementer
Rules: AGENTS.md

# Clamp de vencimento de custos fixos em meses curtos

## Contexto

O endpoint `GET /financial/analytics` pode retornar `Internal server error` quando existe custo fixo com `due_day` 29, 30 ou 31 e o SQL tenta montar uma data em mês que não possui esse dia.

## Escopo

- Ajustar o cálculo de data mensal de custo fixo para usar o último dia do mês quando `due_day` não existir naquele mês.
- Cobrir a regra com teste unitário puro.
- Não alterar API, schema de banco ou contrato de resposta.

## Validação

- `npm run test --workspace @manager/web`
- `npm run lint --workspace @manager/web`
- `npm run build --workspace @manager/web`
