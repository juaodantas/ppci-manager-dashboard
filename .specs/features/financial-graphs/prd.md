# PRD - Aba de Graficos Financeiros

## 1. Executive Summary

- **Problem Statement**: A aba financeira atual consolida e salva dados importantes, mas nao oferece visualizacoes analiticas suficientes para identificar gargalos operacionais e apoiar decisoes de medio/longo prazo. Isso reduz a capacidade da gestao financeira e do dono de antecipar riscos de caixa.
- **Proposed Solution**: Criar uma nova aba de graficos financeiros com comparativos mes a mes e projecao de caixa de 12 meses, usando dados ja registrados no sistema e modelo hibrido de previsao de receita (pagamentos pendentes por vencimento + tendencia historica).
- **Success Criteria**:
  - Disponibilizar 100% dos graficos do MVP com filtros funcionais por empresa e periodo em producao.
  - Reduzir o tempo medio de analise financeira mensal em pelo menos 40% (baseline definido antes do rollout).
  - Atingir erro absoluto percentual medio (MAPE) de projecao de saldo mensal <= 20% apos 3 ciclos mensais completos.
  - Garantir tempo de resposta <= 1.5s (p95) para carregamento da aba com intervalo padrao (12 meses) e 1 empresa.
  - Alcançar adocao semanal da nova aba por >= 70% dos usuarios-alvo (Financeiro + Dono) apos 60 dias.

## 2. User Experience & Functionality

- **User Personas**:
  - **Analista/Responsavel Financeiro**: acompanha fluxo de caixa, compara desempenho mensal e prioriza acoes corretivas.
  - **Dono da Empresa**: monitora saude financeira, risco futuro e gargalos que afetam crescimento.
- **User Stories**:
  - Como responsavel financeiro, quero comparar receita, despesa e saldo mes a mes para identificar variacoes criticas rapidamente.
  - Como dono da empresa, quero ver uma projecao de caixa para 12 meses para antecipar riscos e decidir investimentos/cortes.
  - Como responsavel financeiro, quero visualizar composicao de despesas por tipo (fixo vs variavel) para localizar gargalos operacionais.
  - Como usuario, quero aplicar filtros por empresa e periodo para analisar contexto especifico sem inconsistencias nos dados.
- **Acceptance Criteria**:
  - Para comparativo M/M:
    - Exibir grafico com Receita, Despesa e Saldo por mes no periodo selecionado.
    - Exibir variacao percentual M/M para cada metrica.
    - Aplicar filtros de `company_id` e periodo de forma consistente em todos os componentes.
  - Para projecao 12 meses:
    - Exibir saldo projetado mensal para os proximos 12 meses.
    - Usar previsao hibrida: receitas pendentes por `due_date` + tendencia historica de realizado.
    - Sinalizar meses com saldo projetado negativo.
  - Para composicao de despesas:
    - Exibir participacao de custos fixos e variaveis por mes.
    - Permitir leitura clara de contribuicao relativa (% e valor absoluto).
  - Para qualidade e performance:
    - Tempo de carregamento p95 <= 1.5s no intervalo padrao.
    - Dados de grafico e tabela devem ser reconciliaveis (sem divergencia de total > 0.5%).
- **Non-Goals**:
  - Nao incluir no MVP modelos avancados de previsao (ARIMA/ML).
  - Nao incluir exportacao PDF/CSV no MVP.
  - Nao incluir metas de reducao de atraso como metrica rastreada no sistema.
  - Nao incluir analise semanal/diaria (granularidade inicial mensal).
  - Nao reestruturar todo o modulo financeiro existente.

## 3. AI System Requirements (If Applicable)

- **Tool Requirements**: Nao aplicavel (feature analitica deterministica, sem componente de IA generativa no MVP).
- **Evaluation Strategy**: Nao aplicavel para IA; validacao sera feita por testes funcionais, reconciliacao de dados financeiros e medicao de erro de projecao.

## 4. Technical Specifications

- **Architecture Overview**:
  - Frontend adiciona nova aba "Graficos" dentro do modulo financeiro.
  - Backend expoe endpoint dedicado de analytics financeiro (ex.: `GET /financial/analytics`) para consolidar historico M/M e projecao.
  - Pipeline de calculo:
    1) Carregar historico realizado (receitas/despesas/saldo mensal).
    2) Calcular comparacao M/M e composicao de despesas.
    3) Projetar 12 meses com modelo hibrido:
       - Receita prevista = pagamentos pendentes por vencimento + componente de tendencia historica.
       - Despesa prevista = custos fixos vigentes (+ juros por competencia) + custos variaveis com regra simples baseada em historico.
    4) Retornar payload unico para graficos e indicadores.
- **Integration Points**:
  - **APIs**:
    - Reaproveitar `GET /financial/report` e `GET /financial/entries` como referencia de consistencia.
    - Criar `GET /financial/analytics` com filtros: `company_id`, `date_from`, `date_to`, `horizon_months=12`.
  - **Banco**:
    - Leitura de `financial_entries`, `fixed_costs`, `fixed_cost_interests`, `variable_costs`, `payments`.
  - **Auth**:
    - Reaproveitar autenticacao/autorizacao atual do dashboard; respeitar escopo de empresa no backend.
- **Security & Privacy**:
  - Validar todos os parametros de entrada na boundary da API (tipagem + schema).
  - Aplicar controle de acesso por empresa para impedir vazamento de dados financeiros entre tenants.
  - Nao registrar dados financeiros sensiveis em logs de aplicacao.
  - Definir timeout explicito nas consultas agregadas para evitar degradacao sob intervalos amplos.
  - Garantir trilha de erro tipada e observavel para falhas de calculo/projecao.

## 5. Risks & Roadmap

- **Phased Rollout**:
  - **MVP (v1.0)**:
    - Aba de graficos com comparativo M/M.
    - Composicao de despesas fixas vs variaveis.
    - Projecao de saldo de 12 meses em cenario unico (hibrido).
    - Alertas visuais para meses com saldo negativo.
  - **v1.1**:
    - Ajuste fino das regras de projecao com base no erro observado (MAPE real).
    - Melhorias de performance e observabilidade (telemetria de consulta e uso).
    - Refino de categorizacao de custos para gargalos mais granulares.
  - **v2.0**:
    - Cenarios multiplos (conservador/base/otimista).
    - Exportacao e compartilhamento de relatorios.
    - Expansao para analises avancadas por unidade/centro de custo.
- **Technical Risks**:
  - Projecao com vies se dados de pagamentos pendentes estiverem incompletos/desatualizados.
  - Divergencia entre numeros de telas antigas e nova aba se regras nao forem centralizadas no backend.
  - Performance de consultas com series mensais e multiplos joins em janelas longas.
  - Inconsistencia pre-existente de filtro por empresa pode comprometer confianca inicial dos usuarios.
  - Falta de saldo inicial confiavel pode reduzir precisao de leitura de caixa acumulado.
