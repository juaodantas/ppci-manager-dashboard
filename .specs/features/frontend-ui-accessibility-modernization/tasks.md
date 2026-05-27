Agent: architect
Rules: AGENTS.md

# Tasks: Modernização de UI e Acessibilidade do Frontend

**Feature:** F-FRONT-UI-A11Y-MOD
**Status:** Planejado

**Legenda:** tasks sem dependências bloqueantes podem rodar em paralelo quando não editarem o mesmo arquivo.

## T-01 — Auditar arquivos-alvo antes de editar

**Depende de:** nada
**Pode rodar em paralelo:** não
**Arquivos:** todos os arquivos-alvo da spec

**Descrição:** Ler layout, primitivas, auth, dashboard, clientes, projetos, financeiro e gráficos para confirmar padrões atuais, props existentes e pontos de acoplamento.

**Critérios de verificação:**
- Lista de arquivos tocados e responsabilidade pretendida registrada no plano de implementação.
- Confirmação de que nenhum arquivo fora do escopo será alterado sem necessidade herdada por componente compartilhado.
- Tamanho de `financial/page.tsx` e `FinancialGraphs.tsx` tratado como restrição de design.

## T-02 — Atualizar fundação global segura

**Depende de:** T-01
**Pode rodar em paralelo:** sim, desde que não edite primitivas simultaneamente se houver conflito de CSS global
**Arquivos:** `apps/web/src/app/layout.tsx` e CSS global existente

**Descrição:** Melhorar metadata, tokens/theme foundation, body font/antialias/background/color, `touch-action` e `tap-highlight`, sem dark mode amplo.

**Critérios de verificação:**
- Metadata descreve o dashboard PPCI com mais clareza.
- Body tem base visual consistente e legível.
- Tokens incrementais não quebram telas fora do escopo.
- Nenhuma implementação ampla de dark mode foi adicionada.
- Base visual respeita contraste AA para texto funcional.

## T-03 — Modernizar Button

**Depende de:** T-01
**Pode rodar em paralelo:** sim
**Arquivo:** `apps/web/src/presentation/components/ui/Button.tsx`

**Descrição:** Adicionar foco visível, estados modernos, loading semântico, spinner `aria-hidden` e respeito a `prefers-reduced-motion`.

**Critérios de verificação:**
- Botão em loading comunica estado e evita ativação duplicada.
- Spinner não é anunciado como conteúdo redundante.
- Foco por teclado é visível em todas as variantes.
- Alvo mínimo de toque é respeitado em ações primárias em mobile.

## T-04 — Modernizar Input e Select

**Depende de:** T-01
**Pode rodar em paralelo:** sim
**Arquivos:** `Input.tsx`, `Select.tsx`

**Descrição:** Exigir label acessível ou `aria-label`, associar erros/descriptions com `aria-describedby`, aplicar `aria-invalid`, hover/focus states e cores legíveis no select nativo.

**Critérios de verificação:**
- Uso sem label acessível é prevenido por interface ou tratado explicitamente.
- Erros são vinculados aos campos e anunciáveis quando renderizados.
- Select mantém contraste e legibilidade em navegadores modernos.
- Estados de foco/erro mantêm contraste AA.

## T-05 — Corrigir Modal e criar ConfirmDialog acessível

**Depende de:** T-03, T-04
**Pode rodar em paralelo:** não
**Arquivos:** `Modal.tsx`, novo `ConfirmDialog.tsx` ou equivalente

**Descrição:** Implementar dialog acessível com `role`, `aria-modal`, título rotulado, fechar com `aria-label`, trap/restauração de foco, scroll/overscroll e compor `ConfirmDialog` para ações destrutivas.

**Critérios de verificação:**
- Foco fica contido no modal aberto e retorna ao acionador ao fechar.
- Escape/fechamento preserva comportamento existente seguro.
- ConfirmDialog não duplica lógica central do Modal.
- Preferência de movimento é respeitada em transições do modal.

## T-06 — Atualizar DashboardLayout

**Depende de:** T-02, T-03
**Pode rodar em paralelo:** sim, após fundação
**Arquivo:** `DashboardLayout.tsx`

**Descrição:** Adicionar skip link, `main id`, foco visível, hierarquia visual, navegação responsiva e comportamento de sidebar mobile.

**Critérios de verificação:**
- Skip link aparece no foco e leva ao conteúdo principal.
- Sidebar não causa overflow horizontal em mobile.
- Links de navegação têm estado ativo e foco distinguíveis.
- Hierarquia tipográfica e ritmo espacial seguem direção editorial.

## T-07 — Modernizar login e registro

**Depende de:** T-02, T-03, T-04
**Pode rodar em paralelo:** sim
**Arquivos:** `login/page.tsx`, `register/page.tsx`

**Descrição:** Melhorar layout, microcopy, `autocomplete`, `name`, `spellCheck`, cautela com autofocus mobile, erros `aria-live` e links com foco visível.

**Critérios de verificação:**
- Campos possuem atributos adequados para email, nome e senha.
- Erros de autenticação/registro são anunciáveis.
- Layout funciona sem overflow em mobile.
- Contraste AA e foco visível consistente nos controles.

## T-08 — Modernizar página Dashboard

**Depende de:** T-02, T-03, T-06
**Pode rodar em paralelo:** sim
**Arquivo:** `apps/web/src/app/(dashboard)/page.tsx`

**Descrição:** Reorganizar stat cards, heading, hierarquia visual e ações responsivas.

**Critérios de verificação:**
- Cards têm hierarquia clara e estados visuais consistentes.
- Ações não quebram em mobile.
- Não há alteração de cálculo ou dados exibidos.
- Ritmo espacial e hierarquia tipográfica aderem à direção editorial.

## T-09 — Melhorar Clientes com URL sync

**Depende de:** T-03, T-04, T-05
**Pode rodar em paralelo:** sim, se Projetos não editar helpers compartilhados novos
**Arquivo:** `apps/web/src/app/(dashboard)/customers/page.tsx`

**Descrição:** Corrigir obrigatoriedade, autocomplete email/tel, placeholder/loading com reticências, tabela responsiva, foco em links, texto longo, URL sync para filtros/paginação e manter confirmação destrutiva até ConfirmDialog estar disponível.

**Critérios de verificação:**
- Refresh mantém busca/filtros/página via URL.
- Tabela fica navegável em telas pequenas com wrapper responsivo.
- Delete destrutivo usa ConfirmDialog acessível quando T-05 estiver concluída.

## T-10 — Melhorar Projetos com URL sync

**Depende de:** T-03, T-04
**Pode rodar em paralelo:** sim, se Clientes não editar helpers compartilhados novos
**Arquivo:** `apps/web/src/app/(dashboard)/projects/page.tsx`

**Descrição:** Sincronizar `status`, `search` e `page` na URL, melhorar tabela responsiva, corrigir anti-pattern Link/Button, rotular Select, aplicar reticências e foco visível.

**Critérios de verificação:**
- URL inválida cai em estado seguro.
- Links e botões têm papéis corretos sem aninhamento inválido.
- Tabela não gera overflow global indevido.

## T-11 — Decompor Financeiro antes de feature code

**Depende de:** T-01
**Pode rodar em paralelo:** não
**Arquivo:** `apps/web/src/app/(dashboard)/financial/page.tsx`

**Descrição:** Extrair componentes coesos para forms, filtros, abas, tabelas e estados antes de adicionar acessibilidade ou comportamento novo. Esta task é bloqueante para qualquer melhoria funcional/visual do Financeiro.

**Critérios de verificação:**
- `financial/page.tsx` deixa de concentrar responsabilidades de UI extensa.
- Extrações preservam comportamento existente.
- Nenhuma nova feature de Financeiro é adicionada antes da extração.

## T-12 — Aplicar acessibilidade e modernização no Financeiro

**Depende de:** T-05, T-11
**Pode rodar em paralelo:** não
**Arquivos:** `financial/page.tsx` e subcomponentes extraídos

**Descrição:** Corrigir forms, filtros, tabs com ARIA roles, date inputs/selects sem label, loading com reticências, tabelas responsivas, confirmação destrutiva e erros `aria-live`. URL sync financeiro fica deferido salvo trivial após decomposição.

**Critérios de verificação:**
- Abas têm roles/atributos coerentes ou semântica nativa equivalente.
- Inputs de data/selects estão rotulados.
- Erros e loading são perceptíveis por tecnologia assistiva.
- ConfirmDialog cobre ações destrutivas relevantes.

## T-13 — Melhorar FinancialGraphs sem crescer arquivo

**Depende de:** T-02, T-03
**Pode rodar em paralelo:** sim, desde que não conflite com T-12 em componentes financeiros compartilhados
**Arquivo:** `FinancialGraphs.tsx` e subcomponentes em `presentation/components/financial/`

**Descrição:** Melhorar hierarquia de cards, dots focáveis, alvos de toque, resumos textuais, carrossel acessível por teclado quando viável, tooltip polish e mitigação das limitações de acessibilidade do Recharts.

**Critérios de verificação:**
- Conteúdo essencial dos gráficos tem resumo textual.
- Controles interativos são alcançáveis por teclado e têm alvo adequado.
- `FinancialGraphs.tsx` não ganha nova responsabilidade; extrações são usadas quando necessário.
- Resumos textuais mantêm contraste AA.

## T-14 — Validação final e checklist manual

**Depende de:** T-06, T-07, T-08, T-09, T-10, T-12, T-13
**Pode rodar em paralelo:** não

**Descrição:** Rodar comandos existentes e validar manualmente teclado, foco, responsividade e fluxos principais alterados.

**Comandos de validação:**
- `npm run lint`
- `npm run test`
- `npm run build`

**Critérios de verificação:**
- Comandos passam ou falhas preexistentes são documentadas com saída relevante.
- Checklist confirma skip link, modal/foco, labels, erros, tabelas responsivas e URL sync.
- Nenhuma alteração de backend/API/schema foi realizada.
- Checklist manual cobre contraste AA, alvos de toque e `prefers-reduced-motion`.
