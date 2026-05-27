# Design: Modernização de UI e Acessibilidade do Frontend

**Feature:** F-FRONT-UI-A11Y-MOD
**Tipo:** Large — UI transversal com decomposição obrigatória em pontos de risco

## Contexto

Esta feature moderniza o frontend existente com foco em acessibilidade, responsividade e acabamento visual. A implementação deve respeitar a arquitetura atual do Next.js App Router, TailwindCSS v4 e componentes em `presentation`, sem tocar backend, API, schema ou domínio.

## Direção de design

- **Propósito:** tornar o dashboard PPCI mais claro, confiável e eficiente para quem gerencia documentação, custos e prazos, reduzindo esforço cognitivo em telas densas.
- **Tom:** editorial/profissional — tipografia firme, hierarquia precisa, espaços respirados e microdetalhes discretos.
- **Diferenciação:** modernidade contida com alto contraste funcional, foco visível impecável e ritmo espacial claro. Nada ornamental; cada detalhe resolve um problema de legibilidade ou navegação.

## Objetivos e não objetivos

### Objetivos

- Criar base global e componentes primitivos mais acessíveis.
- Melhorar as páginas revisadas em ondas incrementais.
- Controlar tamanho e responsabilidade dos arquivos, especialmente Financeiro e Gráficos.
- Manter visual profissional PPCI com paleta azul/cinza, tokens semânticos e profundidade sutil.
- Aplicar uma estética editorial clara com hierarquia tipográfica e ritmo espacial não uniforme.

### Não objetivos

- Não adicionar UI library.
- Não implementar dark mode completo.
- Não modificar contratos de dados.
- Não redesenhar telas não revisadas diretamente.

## Arquitetura e boundaries

- **Global/App:** metadata, tokens CSS/Tailwind, estilos de body e affordances de toque ficam em `apps/web/src/app/layout.tsx` e CSS global existente, se houver.
- **Primitivas de UI:** `Button`, `Input`, `Select`, `Modal` concentram semântica, estados e acessibilidade reutilizável.
- **Componentes compostos:** `ConfirmDialog` deve depender de `Modal`, não duplicar trap/restauração de foco.
- **Layout:** `DashboardLayout` controla navegação, skip link, sidebar, landmarks e comportamento responsivo.
- **Páginas:** login, registro, dashboard, clientes e projetos aplicam composição visual e query string sem mover lógica de aplicação para componentes globais.
- **Financeiro:** deve ser dividido em subcomponentes de apresentação/formulário/filtros/tabelas antes de qualquer nova melhoria comportamental.
- **Gráficos:** `FinancialGraphs` deve delegar cards, resumos, controles e tooltip para subcomponentes pequenos quando a alteração aumentaria responsabilidade.

## Diretrizes visuais

### Tipografia

- **Escala:** usar escala modular com `clamp()` para headings e textos auxiliares.
- **Hierarquia:** contraste de peso/tamanho deve separar título, subtítulo, label e meta.
- **Carregamento:** manter estratégia atual de fontes; se não houver fonte definida no projeto, propor troca apenas com confirmação (não introduzir fonte nova sem alinhamento).

### Cor e contraste

- **Paleta:** azul/cinza profissional existente, com neutros levemente azulados.
- **Contraste:** garantir AA para texto e ícones funcionais nas áreas alteradas.
- **Foco:** anel/fundo de foco visível usando azul acentuado consistente.

### Layout e ritmo

- **Ritmo espacial:** espaçamentos variáveis (grupos densos + respiros maiores) para evitar monotonia.
- **Assimetrias controladas:** quebras de grid pontuais para ênfase sem comprometer alinhamento global.
- **Tabelas:** sempre com wrapper responsivo, evitando overflow global.

### Motion

- **Duração:** transições curtas (150–200ms) e `ease-out` suave.
- **Acessibilidade:** respeitar `prefers-reduced-motion` em todos os componentes alterados.

## Estruturas e interfaces envolvidas

- Props de `Button`: estados existentes, mais semântica de loading/disabled e classes de foco/motion-safe.
- Props de `Input` e `Select`: suporte obrigatório a `label` ou `aria-label`, `error`, `aria-invalid`, `aria-describedby`, `required` e mensagens associadas.
- Props de `Modal`: `title`/`aria-labelledby`, `aria-describedby` opcional, `onClose`, estado aberto, referência do elemento acionador para restauração de foco quando necessário.
- `ConfirmDialog`: `title`, `description`, `confirmLabel`, `cancelLabel`, `variant`, `onConfirm`, `onCancel`.
- Query params de Clientes: busca/filtros existentes e página.
- Query params de Projetos: `status`, `search` e `page`.

## Decomposição em fases

### Fase 1 — Fundação global e primitivas

1. Atualizar metadata e estilos globais seguros.
2. Melhorar `Button`, `Input`, `Select` e `Modal`.
3. Criar `ConfirmDialog` somente após `Modal` estar acessível.

### Fase 2 — Layout e autenticação

1. Ajustar `DashboardLayout` com skip link, landmarks, foco e sidebar responsiva.
2. Modernizar login/registro com campos corretos, erros anunciáveis e layout mobile seguro.

### Fase 3 — Dashboard, Clientes e Projetos

1. Modernizar dashboard principal.
2. Aplicar tabela responsiva, textos longos, foco e URL sync em Clientes.
3. Aplicar tabela responsiva, URL sync, Select rotulado e correção Link/Button em Projetos.

### Fase 4 — Financeiro

1. Decompor `financial/page.tsx` antes de comportamento novo.
2. Aplicar acessibilidade de forms, filtros, abas, tabelas, loading, erros e confirmação destrutiva.
3. Adiar URL sync do Financeiro, exceto se for trivial e não aumentar acoplamento após a decomposição.

### Fase 5 — FinancialGraphs

1. Evitar crescimento de `FinancialGraphs.tsx`.
2. Melhorar cards, resumo textual, controles focáveis, alvos de toque e tooltip.
3. Documentar limitações práticas de acessibilidade do Recharts no código apenas se houver decisão não óbvia.

## Arquivos e responsabilidades

| Arquivo | Responsabilidade |
|---------|------------------|
| `apps/web/src/app/layout.tsx` | Metadata, base visual global e atributos estruturais seguros. |
| `apps/web/src/presentation/components/ui/Button.tsx` | Botão acessível, loading, foco, motion-safe. |
| `apps/web/src/presentation/components/ui/Input.tsx` | Campo textual com label, erro, descrição e estados. |
| `apps/web/src/presentation/components/ui/Select.tsx` | Select nativo legível, rotulado e com erro associado. |
| `apps/web/src/presentation/components/ui/Modal.tsx` | Dialog acessível, foco, scroll e fechamento. |
| `apps/web/src/presentation/components/ui/ConfirmDialog.tsx` | Confirmação destrutiva acessível baseada em Modal. |
| `apps/web/src/presentation/components/layout/DashboardLayout.tsx` | Landmarks, navegação, sidebar e responsividade. |
| `apps/web/src/app/(auth)/login/page.tsx` | Login moderno e acessível. |
| `apps/web/src/app/(auth)/register/page.tsx` | Registro moderno e acessível. |
| `apps/web/src/app/(dashboard)/page.tsx` | Cards, hierarquia e ações responsivas. |
| `apps/web/src/app/(dashboard)/customers/page.tsx` | Listagem/formulário, tabela responsiva, URL sync. |
| `apps/web/src/app/(dashboard)/projects/page.tsx` | Filtros, URL sync, tabela e ações acessíveis. |
| `apps/web/src/app/(dashboard)/financial/page.tsx` | Orquestração após decomposição; não deve concentrar UI extensa. |
| `apps/web/src/presentation/components/financial/FinancialGraphs.tsx` | Orquestração dos gráficos; não deve crescer com subresponsabilidades. |

## Arquivos que não devem crescer

- `apps/web/src/app/(dashboard)/financial/page.tsx` — 664 linhas; decomposição é bloqueante antes de feature code.
- `apps/web/src/presentation/components/financial/FinancialGraphs.tsx` — 302 linhas; melhorias devem ser extraídas quando adicionarem responsabilidade.

## Riscos de acoplamento

- Centralizar regras de URL sync em componentes de UI globais misturaria apresentação e navegação; manter nas páginas ou hooks locais.
- `ConfirmDialog` duplicando lógica de `Modal` criaria divergência de acessibilidade; deve compor `Modal`.
- Tokens globais agressivos podem alterar telas fora do escopo; mudanças devem ser incrementais e semanticamente seguras.
- Abas do Financeiro podem misturar estado visual, filtros e regras financeiras; separar componentes de apresentação de hooks/dados existentes.

## Plano de implementação

1. Ler os arquivos-alvo antes de editar e confirmar padrões existentes.
2. Implementar fundação global mínima e primitivas.
3. Validar rapidamente com lint/type/build parcial quando possível.
4. Ajustar layout e auth.
5. Ajustar dashboard, clientes e projetos com URL sync.
6. Decompor Financeiro e só então aplicar melhorias de acessibilidade.
7. Melhorar FinancialGraphs por extração, evitando crescimento.
8. Rodar validações finais e checklist manual de teclado/responsividade.

## Critérios de aceite

- Todos os critérios de `spec.md` CA01–CA10 atendidos.
- Nenhuma alteração em backend, schema ou contrato de API.
- Arquivos grandes não recebem novas responsabilidades sem extração.
- A navegação por teclado cobre menu, forms, modais, tabelas interativas e controles de gráficos alterados.

## Comandos de validação

- `npm run lint`
- `npm run test`
- `npm run build`

Se algum comando falhar por problema preexistente, registrar comando, saída relevante e impacto antes de encerrar a implementação.

## Questões em aberto

- A validação manual deve usar quais larguras padrão: 360, 768, 1024 e 1440 px?
- ConfirmDialog deve substituir confirmações destrutivas fora de Clientes/Financeiro se forem encontradas durante a alteração de componentes compartilhados?
- O projeto quer formalizar guidelines visuais em documento separado após esta feature ou manter apenas tokens/código?
- Existe fonte já padronizada no projeto para atender à hierarquia editorial, ou devemos manter a atual e apenas ajustar escala/peso?
