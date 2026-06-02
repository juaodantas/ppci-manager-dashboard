# Padronizacao de datas locais no frontend

## Contexto

Algumas telas do frontend tratam datas puras no formato `YYYY-MM-DD` com `new Date(date).toLocaleDateString('pt-BR')` ou geram datas atuais com `new Date().toISOString().slice(0, 10)`. Esses usos dependem de UTC/timezone e podem deslocar a data em um dia.

O caso observado foi em pagamentos: ao marcar um pagamento como pago, a data registrada pode cair um dia apos a data esperada, especialmente quando `toISOString()` ja representa o dia seguinte em UTC.

## Objetivo

Padronizar a criacao e exibicao de datas locais no frontend para que datas de dominio (`DATE`/`YYYY-MM-DD`) sejam tratadas como datas sem timezone.

## Requisitos

- LOCAL-DATE-001: Ao preencher automaticamente a data de pagamento, o frontend deve usar a data local do usuario, nao a data UTC.
- LOCAL-DATE-002: Ao preencher automaticamente a data de emissao de imposto, o frontend deve usar a data local do usuario, nao a data UTC.
- LOCAL-DATE-003: Datas puras `YYYY-MM-DD` devem ser exibidas em `pt-BR` sem criar `Date` diretamente a partir da string pura.
- LOCAL-DATE-004: Lancamentos financeiros devem exibir `entry.date` sem deslocamento por timezone.
- LOCAL-DATE-005: Pagamentos devem exibir `due_date` e `paid_date` sem deslocamento por timezone.
- LOCAL-DATE-006: Custos variaveis devem exibir `date` sem deslocamento por timezone.
- LOCAL-DATE-007: Projetos e orcamentos devem exibir `start_date`, `end_date` e `valid_until` sem deslocamento por timezone.
- LOCAL-DATE-008: PDFs de orcamento e contrato devem formatar datas puras sem deslocamento por timezone.
- LOCAL-DATE-009: Timestamps como `created_at` podem continuar sendo tratados como instantes, desde que nao sejam confundidos com datas puras.

## Escopo tecnico

- Criar util compartilhado para formatacao de datas locais no frontend.
- Substituir usos perigosos de `toISOString().slice(0, 10)` para inputs `type="date"`.
- Substituir usos perigosos de `new Date(dateOnly).toLocaleDateString('pt-BR')` em datas de dominio.

## Arquivos candidatos

- `apps/web/src/app/(dashboard)/projects/[id]/page.tsx`
- `apps/web/src/presentation/components/financial/FinancialEntriesTable.tsx`
- `apps/web/src/presentation/components/financial/VariableCostsSection.tsx`
- `apps/web/src/presentation/components/financial/FinancialMonthlyTable.tsx`
- `apps/web/src/app/(dashboard)/projects/page.tsx`
- `apps/web/src/app/(dashboard)/quotes/page.tsx`
- `apps/web/src/app/(dashboard)/quotes/[id]/page.tsx`
- `apps/web/src/presentation/components/pdf/quote-pdf.tsx`
- `apps/web/src/presentation/components/pdf/contract-pdf.tsx`
- `apps/web/src/presentation/components/financial/FixedCostForm.tsx`

## Fora de escopo

- Alterar schema do banco.
- Alterar contratos da API.
- Migrar dados existentes.
- Mudar comportamento de timestamps reais, como `created_at`.

## Validacao

- Build/typecheck do frontend deve passar.
- Ao marcar pagamento como pago, a data enviada deve ser a data local selecionada no input.
- Datas `YYYY-MM-DD` devem aparecer no mesmo dia no frontend, financeiro e PDFs.
