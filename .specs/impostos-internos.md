# Spec — Impostos internos por projeto (dedução)

## 1) Contexto
Atualmente o total do projeto é calculado pela soma de `project_services.total_price`. Não existe tratamento para impostos internos. Precisamos permitir que o usuário adicione impostos internos durante o andamento do projeto, que afetem o total do projeto como dedução e gerem um custo variável quando o usuário emitir a nota (interna).

## 2) Objetivos
- Adicionar impostos internos por projeto ao longo do tempo.
- Impostos impactam o total do projeto como dedução.
- Permitir múltiplos impostos por projeto.
- Impostos não aparecem em PDFs.
- Emissão de nota cria custo variável com nome padronizado.
- Exibir status visual Emitido / Não emitido para cada imposto.
- Fluxo com confirmação + escolha de data.

## 3) Não-Objetivos
- Edição ou exclusão de impostos.
- Alterar PDFs (apenas garantir que imposto não apareça).
- Automatizar emissão ou integração externa de NF.
- Criar novos relatórios financeiros.

## 4) Requisitos Funcionais
- RF01: Usuário pode adicionar imposto em um projeto.
- RF02: Cada imposto é um item em `project_services`.
- RF03: Imposto tem tipo especial dedução.
- RF04: Total do projeto considera deduções.
- RF05: Lista de serviços mostra status Emitido/Não emitido para impostos.
- RF06: Botão “Emitir nota” cria custo variável.
- RF07: Emissão pede confirmação e data.
- RF08: Impostos não aparecem em PDFs.
- RF09: Impostos não podem ser editados nem excluídos.

## 5) Requisitos Não Funcionais
- RNF01: Emissão é idempotente (não duplica custo).
- RNF02: Retrocompatível com projetos existentes.
- RNF03: Validação de input na boundary via Zod.

## 6) Dados / Schema

### 6.1 Tabelas existentes
- `project_services`
- `projects` (campo `total_value`)
- `variable_costs`

### 6.2 Novos campos (propostos)
Em `project_services`:

```sql
service_type ENUM('service', 'tax_deduction') DEFAULT 'service'
tax_status ENUM('not_issued', 'issued') NULL
tax_issued_at DATE NULL
tax_variable_cost_id UUID NULL REFERENCES variable_costs(id)
```

`tax_status` só é usado quando `service_type = 'tax_deduction'`.

## 7) Regras de cálculo do total
Trigger atual soma `total_price`. Deve ser ajustado para:

```
SUM(
  CASE 
    WHEN service_type = 'tax_deduction' THEN -total_price
    ELSE total_price
  END
)
```

## 8) Fluxos

### 8.1 Adicionar imposto
1. Usuário entra no projeto (aba serviços).
2. Clica em “Adicionar imposto”.
3. Informa valor (R$) e descrição opcional.
4. Sistema cria `project_services` com:
   - `service_type = 'tax_deduction'`
   - `tax_status = 'not_issued'`
   - `quantity = 1`
   - `unit_price = valor`
   - `total_price = valor`

### 8.2 Emitir nota
1. Usuário clica “Emitir nota” no imposto.
2. Modal com confirmação e data obrigatória.
3. Ao confirmar:
   - Cria `variable_costs`:
     - `name = "imposto - {nome do projeto} - {data}"`
     - `amount = total_price`
     - `date = data escolhida`
   - Atualiza imposto:
     - `tax_status = 'issued'`
     - `tax_issued_at = data`
     - `tax_variable_cost_id = id do custo`

### 8.3 Visualização PDF
- PDFs devem ignorar registros `service_type = 'tax_deduction'`.

## 9) UI / UX

### Detalhe do Projeto → Aba Serviços
- Botão “Adicionar imposto”.
- Na tabela de serviços:
  - imposto exibe badge de status:
    - Não emitido (amarelo)
    - Emitido (verde)
  - ação “Emitir nota” visível somente se não emitido.

### Modal Emitir Nota
- texto de confirmação
- input obrigatório de data
- botões: confirmar / cancelar

## 10) Integração financeira
- Emissão cria `variable_costs`.
- Financeiro já agrega `variable_costs`.

## 11) Idempotência
- Se `tax_status = issued` ou `tax_variable_cost_id` preenchido:
  - bloquear nova emissão
  - exibir mensagem

## 12) Migração / Retrocompatibilidade
- Migração adiciona novos campos.
- Backfill: registros antigos ficam `service_type = 'service'`.
- Sem alterações nos dados antigos.

## 13) Critérios de aceite
- CA01: Adicionar impostos gera dedução no total do projeto.
- CA02: Múltiplos impostos são suportados.
- CA03: Botão “Emitir nota” cria custo variável uma única vez.
- CA04: Status visual muda para “Emitido”.
- CA05: Impostos não aparecem no PDF.
- CA06: Projetos antigos seguem funcionando sem alteração.

## 14) Decisões e alternativas descartadas
- Decisão: impostos como `project_services` com tipo especial.
  - Alternativa descartada: tabela nova `project_taxes`.
- Decisão: emissão gera `variable_costs`.
  - Alternativa descartada: criar `financial_entries` direto.
- Decisão: imposto não aparece no PDF.
  - Alternativa descartada: mostrar com destaque.
