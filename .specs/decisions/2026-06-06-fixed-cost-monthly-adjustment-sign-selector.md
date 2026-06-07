# Decisão — Ajuste mensal com seletor de acréscimo ou desconto

## O que foi decidido

A UI da gestão mensal de custos fixos não deve exigir que usuários digitem números negativos para registrar desconto.

O formulário mensal deve apresentar:

- seletor/label `Acréscimo` ou `Desconto`;
- input de valor do ajuste aceitando apenas valor positivo ou zero.

No submit, o frontend deve converter a escolha para valor assinado antes de enviar ao backend:

- `Acréscimo` envia valor positivo;
- `Desconto` envia valor negativo.

O backend continua armazenando e validando o ajuste mensal como valor assinado e deve rejeitar qualquer alteração que deixe o total mensal final menor que zero.

## Por que

Usuários não devem precisar conhecer a convenção técnica de sinal negativo para descontos. A seleção explícita reduz erro de preenchimento e mantém o contrato/backend compatível com a regra de domínio de ajuste assinado.

## O que foi descartado

- Exigir que o usuário digite valor negativo para desconto.
- Usar apenas um campo genérico `Ajuste do mês` com helper text explicando negativo/positivo.
- Remover valor assinado do backend, o que deslocaria regra de domínio para a UI e exigiria mudança maior de contrato/persistência.
