# Decisão — Navegação mensal dentro da aba Custos Fixos

## O que foi decidido

A feature de gestão mensal de custos fixos não criará uma quinta aba principal.

A estrutura principal permanece:

- Lançamentos
- Custos Fixos
- Custos Variáveis
- Gráficos

A aba principal continua com o nome `Custos Fixos`. Dentro dela, a gestão mensal deve ser apresentada como a visão principal, com o texto `Gestão mensal dos custos fixos` e uma competência mensal em destaque.

Ao abrir a aba `Custos Fixos`, o sistema deve selecionar o mês atual por padrão. A navegação deve permitir avançar e voltar mês a mês:

```text
Custos Fixos — Junho/2026
[← Maio] [Junho/2026] [Julho →]
```

Dentro da aba, a estrutura esperada é:

```text
Gestão mensal dos custos fixos
Competência: Junho/2026

[Gestão mensal] [Cadastro recorrente]

Tabela:
- custo
- valor base
- valor do mês
- status
- ações
```

## Por que

Mostrar o filtro global de período e um seletor mensal na mesma aba criaria ambiguidade para o usuário. O filtro global permite períodos longos, enquanto a gestão de custos fixos é uma operação mensal por competência.

Ao trocar o filtro de período por navegação mensal dentro da aba `Custos Fixos`, a tela comunica claramente que o usuário está gerenciando um mês específico.

## O que foi descartado

- Criar uma nova aba principal para gestão mensal de custos fixos.
- Exibir simultaneamente filtro global de período e seletor mensal dentro da aba `Custos Fixos`.
- Renomear a aba principal para `Custos Fixos Mensais`, `Custos Fixos por Competência` ou `Gestão de Custos Fixos` nesta etapa.

`Custos Fixos por Competência` permanece como alternativa futura caso o nome simples da aba gere confusão em testes de uso.
