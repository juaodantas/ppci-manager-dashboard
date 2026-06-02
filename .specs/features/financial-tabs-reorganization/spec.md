# Reorganizacao da pagina financeira em abas

## Contexto

A aba financeira concentra resumo, lancamentos, custos variaveis, custos fixos e graficos em uma mesma area de visao geral. Quando ha muitos lancamentos, a tabela cresce e empurra as secoes de custos para baixo, prejudicando a navegacao e a rolagem.

## Objetivo

Reorganizar a pagina financeira em abas independentes para reduzir altura acumulada da tela e tornar cada area mais previsivel.

## Requisitos

- FIN-TABS-001: A pagina financeira deve exibir as abas Lancamentos, Custos Fixos, Custos Variaveis e Graficos.
- FIN-TABS-002: A aba Lancamentos deve exibir os cards de resumo financeiro, a tabela mensal quando aplicavel e a tabela de lancamentos.
- FIN-TABS-003: A aba Custos Fixos deve exibir um resumo simples dos custos fixos e a tabela de custos fixos.
- FIN-TABS-004: A aba Custos Variaveis deve exibir um resumo simples dos custos variaveis e a tabela de custos variaveis.
- FIN-TABS-005: A aba Graficos deve manter o comportamento atual de carregamento, erro, estado vazio e exibicao dos graficos.
- FIN-TABS-006: A mudanca nao deve alterar API, schema de banco ou contratos de dados.
- FIN-TABS-007: As tabelas de Custos Fixos e Custos Variaveis devem limitar a altura da area da tabela e permitir scroll interno com cabecalho fixo, seguindo o padrao da tabela de Lancamentos.

## Fora de escopo

- Paginacao completa de lancamentos.
- Refatoracao do carregamento de juros de custos fixos.
- Ajuste global do layout de scroll do dashboard.

## Validacao

- Typecheck/build do frontend deve passar.
- As quatro abas devem alternar sem desmontar modais e fluxos de criacao/edicao existentes.
- Custos Fixos e Custos Variaveis devem manter o cabecalho visivel ao rolar muitos registros.
