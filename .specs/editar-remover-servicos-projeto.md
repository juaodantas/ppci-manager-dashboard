# Spec — Editar e remover servicos vinculados ao projeto

## 1) Contexto
Hoje o usuario consegue adicionar servicos ao projeto e remover servicos, mas nao consegue editar. Precisa ajustar quantidade, preco unitario e descricao quando houver erro de lancamento. A edicao deve respeitar as mesmas restricoes do projeto (projeto finalizado bloqueia alteracoes).

## 2) Objetivos
- Permitir editar servicos regulares vinculados ao projeto.
- Manter remocao de servicos regulares.
- Preservar bloqueio de edicao/remocao quando projeto esta `finished`.

## 3) Nao-Objetivos
- Editar/remover impostos internos (tratado em spec separada).
- Alterar fluxo de pagamentos ou emissao de impostos.
- Criar historico/auditoria de alteracoes.

## 4) Requisitos Funcionais
- RF01: Usuario pode editar servico regular do projeto (quantidade, preco unitario, descricao).
- RF02: Usuario pode remover servico regular do projeto.
- RF03: Servicos do tipo `tax_deduction` nao sao alterados por esta feature.
- RF04: Em projeto com status `finished`, edicao/remocao permanecem bloqueadas.

## 5) Requisitos Nao Funcionais
- RNF01: Validacao de input na boundary via Zod.
- RNF02: Respostas de erro consistentes (422 para violacao de regra de negocio).

## 6) Regras e Validacoes
- Servico regular e aquele com `service_type = 'service'` (ou ausente).
- Edicao permite ajustar:
  - `quantity`
  - `unit_price`
  - `description` (opcional)
- Edicao nao altera `service_id`.

## 7) Fluxos

### 7.1 Editar servico regular
1. Usuario abre projeto (aba Servicos).
2. Em um servico regular, clica em Editar.
3. Modal abre com dados atuais.
4. Usuario altera quantidade/preco/descricao.
5. Sistema atualiza `project_services` e recalcula total do projeto.

### 7.2 Remover servico regular
1. Usuario clica em Remover em um servico regular.
2. Sistema remove o registro `project_services` e recalcula total.

## 8) UI / UX
- Na tabela de servicos regulares, exibir acoes Editar/Remover quando projeto nao estiver finalizado.
- Modal de edicao segue padrao do modal de adicionar servico.
- Mensagem de bloqueio quando projeto estiver finalizado: "Projeto finalizado — edicao bloqueada".

## 9) Backend / API
- Reutilizar endpoints existentes:
  - `PUT /project-services/:id` (editar)
  - `DELETE /project-services/:id` (remover)
- No use-case de update/removal, garantir que:
  - `service_type` diferente de `tax_deduction`
  - projeto nao esteja `finished`

## 10) Criterios de Aceite
- CA01: Editar servico regular atualiza valores e total do projeto.
- CA02: Remover servico regular remove linha e recalcula total.
- CA03: Em projeto finalizado, nao existe acao de editar/remover (UI) e API bloqueia.
- CA04: Servicos `tax_deduction` nao sao alterados por esta feature.

## 11) Arquivos e Pontos de Integracao
- UI: `apps/web/src/app/(dashboard)/projects/[id]/page.tsx`
- Hooks: `apps/web/src/presentation/hooks/useProjects.ts`
- HTTP repo: `apps/web/src/infrastructure/http/project.http-repository.ts`
- API routes: `supabase/functions/api/routes/projects.ts`
- Use-cases: `supabase/functions/api/use-cases/project/update-project-service.ts`, `supabase/functions/api/use-cases/project/remove-project-service.ts`

## 12) Notas de Teste
- Editar servico regular altera total do projeto.
- Remover servico regular altera total do projeto.
- Tentativa de editar/remover em projeto finalizado retorna 422.
