# Spec: Modernização de UI e Acessibilidade do Frontend

**ID:** F-FRONT-UI-A11Y-MOD
**Status:** Planejado
**Tipo:** Large — modernização transversal de frontend, acessibilidade e responsividade

## Contexto

A revisão baseada em Web Interface Guidelines identificou inconsistências de acessibilidade, responsividade, hierarquia visual e padrões de interação no frontend. A feature existe para elevar a qualidade percebida do dashboard PPCI sem alterar regras de negócio, backend, API ou schema de banco.

O escopo cobre primeiro os arquivos explicitamente revisados: layout principal, primitivas de UI, páginas de autenticação, dashboard, clientes, projetos, financeiro e gráficos financeiros. Telas não revisadas, como orçamentos, usuários e empresas, ficam fora do escopo inicial salvo ajustes indiretos herdados por componentes compartilhados.

## Objetivos

- Modernizar a experiência visual preservando a paleta profissional azul/cinza do produto PPCI.
- Aplicar direção editorial/profissional com hierarquia tipográfica clara e ritmo espacial intencional.
- Corrigir problemas de acessibilidade em navegação por teclado, labels, foco, diálogos, erros e estados dinâmicos.
- Melhorar responsividade mobile/tablet/desktop das páginas revisadas.
- Criar fundação incremental de tokens globais para cor, espaçamento, raio, profundidade e estados, sem dark mode amplo.
- Sincronizar filtros e paginação de Clientes e Projetos com a URL quando seguro.
- Introduzir confirmação destrutiva acessível após a base de Modal estar adequada.
- Reduzir risco de acoplamento decompondo arquivos grandes antes de novas melhorias de comportamento.

## Não objetivos

- Não alterar backend, endpoints, contratos de API, schema de banco ou regras financeiras.
- Não incluir biblioteca nova de UI, design system externo ou framework de testes novo.
- Não implementar dark mode completo.
- Não redesenhar telas não revisadas diretamente, exceto melhorias herdadas por `Button`, `Input`, `Select`, `Modal` ou tokens globais.
- Não substituir confirmação nativa destrutiva antes de existir `ConfirmDialog` acessível baseado no Modal corrigido.
- Não adicionar comportamento novo ao Financeiro antes da decomposição obrigatória do arquivo grande.

## Requisitos Funcionais

| ID | Requisito |
|----|-----------|
| RF01 | `DashboardLayout` deve oferecer layout responsivo/mobile, skip link funcional para `main`, `main id` estável, links com `focus-visible`, hierarquia visual clara e comportamento de sidebar adequado a telas pequenas. |
| RF02 | `Button` deve ter estados modernos, foco visível, semântica de loading, spinner `aria-hidden`, respeito a `prefers-reduced-motion` e não depender apenas de cor. |
| RF03 | `Input` e `Select` devem exigir label acessível ou `aria-label`, suportar `aria-invalid`, `aria-describedby`, erros com região anunciável quando aplicável, estados hover/focus e cores nativas legíveis. |
| RF04 | `Modal` deve expor `role="dialog"`, `aria-modal`, título rotulável, botão fechar com `aria-label`, trap de foco, restauração de foco e comportamento correto de scroll/overscroll. |
| RF05 | A fundação global deve melhorar metadata, tokens, fonte/cor/background/antialias, `touch-action` e `tap-highlight` sem ativar dark mode amplo. |
| RF06 | Login e registro devem ter layout moderno, campos com `autocomplete`, `name`, `spellCheck` adequado, cautela com autofocus em mobile, erros `aria-live`, links com foco visível e microcopy melhor. |
| RF07 | Dashboard deve ter cards estatísticos modernos, hierarquia de título equilibrada e ações responsivas. |
| RF08 | Clientes deve corrigir semântica de obrigatoriedade, autocomplete de email/tel, placeholders com reticências, loading com reticências, tabela responsiva, links focáveis e tratamento de texto longo. |
| RF09 | Clientes deve sincronizar filtros e paginação com URL sem quebrar navegação, refresh ou compartilhamento de link. |
| RF10 | Projetos deve sincronizar status, busca e página na URL quando seguro, melhorar tabela responsiva, eliminar anti-pattern Link/Button, rotular Select, usar reticências e foco visível. |
| RF11 | Financeiro deve cobrir formulários, filtros, abas com roles ARIA, inputs de data/select sem label, loading com reticências, tabelas responsivas, confirmação destrutiva e erros `aria-live`, mas somente após decomposição. |
| RF12 | `FinancialGraphs` deve melhorar hierarquia de cards, pontos focáveis, alvos de toque, resumos textuais, carrossel acessível por teclado quando viável, tooltip e documentar limites de acessibilidade do Recharts. |
| RF13 | Um `ConfirmDialog` acessível deve substituir confirmações destrutivas nativas depois da fundação de `Modal`. |

## Requisitos Não Funcionais

| ID | Requisito |
|----|-----------|
| RNF01 | A implementação deve manter TypeScript estrito, sem `any`, `@ts-ignore`, `as unknown` ou double cast. |
| RNF02 | A UI deve ser navegável por teclado nas áreas alteradas, com foco visível e ordem lógica. |
| RNF03 | O layout deve permanecer funcional em mobile, tablet e desktop, sem overflow horizontal indevido. |
| RNF04 | Alterações visuais devem reutilizar Tailwind e componentes existentes; novos componentes pequenos de apresentação são permitidos. |
| RNF05 | Arquivos próximos ou acima de 300 linhas não devem crescer com nova responsabilidade; Financeiro exige decomposição prévia por ter 664 linhas e `FinancialGraphs` deve evitar crescimento por ter 302 linhas. |
| RNF06 | Mudanças devem preservar contratos existentes e não introduzir dependências externas. |
| RNF07 | Estados dinâmicos relevantes devem ser perceptíveis por tecnologias assistivas, especialmente erros, loading e diálogos. |
| RNF08 | Textos e ícones funcionais nas áreas alteradas devem cumprir contraste AA. |
| RNF09 | Controles de ação primária em mobile devem respeitar alvo mínimo de toque (>= 44px). |
| RNF10 | Preferências de movimento do usuário (`prefers-reduced-motion`) devem ser respeitadas. |

## Abordagem e decisões

- Preservar direção visual azul/cinza de negócio, adicionando profundidade moderna com tokens semânticos, espaçamento, raios, sombras sutis e gradientes discretos.
- Aplicar melhorias globais e em primitivas antes de páginas, para evitar correções duplicadas.
- Sincronizar URL em Clientes e Projetos; adiar URL sync no Financeiro salvo se ficar trivial após decomposição.
- Implementar `ConfirmDialog` acessível somente depois de `Modal` suportar foco, rotulagem e restauração corretamente.
- Decompor `apps/web/src/app/(dashboard)/financial/page.tsx` antes de qualquer comportamento novo ou refinamento amplo.
- Evitar crescimento de `FinancialGraphs.tsx`; melhorias devem ser extraídas para subcomponentes ou utilitários coesos quando necessário.
- Não cobrir diretamente quotes, users e companies nesta feature inicial.

## Arquivos-alvo

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/presentation/components/layout/DashboardLayout.tsx`
- `apps/web/src/presentation/components/ui/Button.tsx`
- `apps/web/src/presentation/components/ui/Input.tsx`
- `apps/web/src/presentation/components/ui/Select.tsx`
- `apps/web/src/presentation/components/ui/Modal.tsx`
- `apps/web/src/presentation/components/ui/ConfirmDialog.tsx` ou equivalente pequeno novo
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/app/(dashboard)/page.tsx`
- `apps/web/src/app/(dashboard)/customers/page.tsx`
- `apps/web/src/app/(dashboard)/projects/page.tsx`
- `apps/web/src/app/(dashboard)/financial/page.tsx`
- `apps/web/src/presentation/components/financial/FinancialGraphs.tsx`
- Subcomponentes extraídos em `apps/web/src/presentation/components/financial/` quando necessário

## Casos de borda

- Usuário navega apenas por teclado e abre/fecha modal repetidamente; foco deve retornar ao acionador.
- Erro de formulário aparece após submit; mensagem deve ser anunciável e vinculada ao campo quando aplicável.
- Tela pequena com sidebar aberta; conteúdo não deve ficar inacessível nem gerar scroll horizontal global.
- Tabelas com textos longos, emails, telefones ou nomes de projeto extensos não devem quebrar o layout.
- URL com query inválida deve cair em estado seguro sem quebrar listagem.
- Usuário com `prefers-reduced-motion` não deve receber animações obrigatórias de spinner/transição.
- Controles interativos devem manter foco visível mesmo com contraste reduzido ou luz ambiente intensa.
- Gráficos Recharts podem ter acessibilidade limitada; resumo textual e controles focáveis devem cobrir o conteúdo essencial.

## Critérios de aceitação

- CA01: Existe skip link visível ao foco apontando para `main` e `main` possui `id` consistente.
- CA02: Todos os campos alterados possuem label acessível ou `aria-label`, e estados inválidos ficam vinculados a mensagens por `aria-describedby`.
- CA03: Modais têm `role="dialog"`, `aria-modal`, título acessível, foco preso durante abertura e foco restaurado ao fechar.
- CA04: Botões em loading expõem estado semântico e spinners não são anunciados como conteúdo redundante.
- CA05: Login, registro, Clientes, Projetos, Dashboard, Financeiro e Gráficos não apresentam overflow horizontal indevido em largura mobile comum.
- CA06: Clientes e Projetos preservam filtros/página em refresh e link compartilhado por query string.
- CA07: Confirmações destrutivas usam diálogo acessível somente após a base de Modal; antes disso, confirmação nativa pode permanecer.
- CA08: `financial/page.tsx` é decomposto antes de receber nova lógica de UI/comportamento.
- CA09: `FinancialGraphs.tsx` não cresce com nova responsabilidade; melhorias são extraídas se necessário.
- CA10: `npm run lint`, `npm run test` e `npm run build` passam ou falhas existentes são documentadas com evidência.
- CA11: Contraste AA é observado para texto e ícones funcionais nas áreas alteradas.
- CA12: Controles primários em mobile respeitam alvo mínimo de toque.
- CA13: Preferências de movimento são respeitadas nas áreas alteradas.

## Questões em aberto

- Qual conjunto mínimo de breakpoints deve ser usado como gate manual de responsividade além dos padrões Tailwind?
- O projeto aceitará testes de acessibilidade automatizados no futuro ou a validação desta feature será manual + lint/build/test existentes?
- A substituição de confirmação nativa deve ser aplicada em todas as telas herdadas por componentes compartilhados ou apenas Clientes/Financeiro no primeiro corte?
- O contraste mínimo AA para texto e ícones funcionais está confirmado como requisito obrigatório?
