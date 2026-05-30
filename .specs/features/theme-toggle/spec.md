# Spec: Alternância de tema claro/escuro

## Contexto

O dashboard usa hoje classes de apresentação majoritariamente claras (`bg-white`, `bg-gray-50`, `text-slate-900`) em layouts, páginas de autenticação, componentes de UI e páginas do dashboard. Isso impede o usuário de escolher uma experiência visual escura quando preferir trabalhar com menor luminosidade.

A feature existe para adicionar uma alternância explícita entre tema claro e tema escuro, com persistência local da escolha do usuário e aplicação global nas telas web de autenticação e dashboard. O escopo é exclusivamente de apresentação: não altera domínio, aplicação, infraestrutura, APIs, banco, contratos ou documentos PDF gerados.

## Goals

- Suportar exatamente dois valores de tema: `light` e `dark`.
- Usar `light` como padrão quando não existir preferência persistida.
- Persistir a escolha do usuário localmente no navegador.
- Aplicar o tema globalmente à UI web de autenticação e dashboard.
- Expor um controle acessível de alternância de tema no layout do dashboard.
- Manter as mudanças limitadas à camada de apresentação do frontend.
- Preservar TypeScript estrito, sem `any`, `@ts-ignore`, `as unknown` ou double cast.

## Non-goals / Fora de escopo

- Adicionar opção de tema do sistema, detecção por `prefers-color-scheme` ou sincronização automática com o SO.
- Alterar documentos PDF ou componentes usados exclusivamente para renderização/download de PDF.
- Alterar domínio, casos de uso, infraestrutura, API, Supabase, migrations, contratos ou schemas.
- Persistir preferência no backend ou por usuário no banco de dados.
- Implementar múltiplas paletas, customização por marca, temas por empresa ou editor de cores.
- Introduzir nova biblioteca de tema se o comportamento puder ser implementado com React, CSS/Tailwind e padrões locais.
- Redesenhar fluxos, layout estrutural, navegação, formulários ou regras de negócio.

## Requisitos rastreáveis

- **REQ-THEME-001**: O modelo de tema deve aceitar somente os valores literais `'light'` e `'dark'`.
- **REQ-THEME-002**: Quando não houver valor persistido, a aplicação deve inicializar em `light`.
- **REQ-THEME-003**: Quando houver valor persistido válido, a aplicação deve inicializar usando esse valor.
- **REQ-THEME-004**: Quando o usuário alternar o tema, a escolha deve ser persistida para próximas visitas no mesmo navegador.
- **REQ-THEME-005**: O tema ativo deve ser aplicado globalmente às telas de autenticação e às telas dentro de `DashboardLayout`.
- **REQ-THEME-006**: O dashboard deve exibir um toggle acessível, operável por teclado e com nome/estado compreensíveis para tecnologia assistiva.
- **REQ-THEME-007**: O toggle deve alternar somente entre claro e escuro; não deve exibir nem aceitar opção de sistema.
- **REQ-THEME-008**: Documentos PDF e componentes de PDF devem manter estilos próprios e não depender do tema da aplicação.
- **REQ-THEME-009**: A implementação deve ficar na camada de apresentação (`apps/web/src/app/**` e `apps/web/src/presentation/**`) e não tocar em domínio, aplicação, infraestrutura ou `supabase/**`.
- **REQ-THEME-010**: Valores externos ao tipo esperado, se lidos da persistência local, devem ser tratados como ausência de preferência e resultar em `light`.
- **REQ-THEME-011**: O estado inicial deve evitar UI inconsistente sempre que possível dentro das restrições do App Router e renderização client-side.
- **REQ-THEME-012**: A implementação deve manter TypeScript estrito e padrões existentes de componentes React.

## Technical approach e decisões de design

- Criar uma solução de tema na camada de apresentação, preferencialmente com um provider/hook coeso em `apps/web/src/presentation/contexts/` ou `apps/web/src/presentation/providers/`, integrado ao `RootLayout` em `apps/web/src/app/layout.tsx`.
- Representar o tema com union type explícito: `type Theme = 'light' | 'dark'`.
- Validar a leitura de `localStorage` com type guard ou parser pequeno, retornando `light` quando o valor persistido não for exatamente `light` ou `dark`.
- Persistir a escolha em `localStorage` com chave estável, por exemplo `ppci-manager-theme`, mantendo a persistência local e sem backend.
- Aplicar o tema globalmente por atributo ou classe no elemento raiz do documento, preferencialmente `data-theme="light|dark"` em `<html>` ou em um wrapper global controlado pelo provider.
- Centralizar tokens globais de cor em CSS (`globals.css`) ou classes Tailwind condicionadas em componentes de apresentação existentes, evitando lógica de tema em domínio/aplicação/infra.
- Priorizar atualização de superfícies compartilhadas primeiro:
  - `apps/web/src/app/layout.tsx` para instalar o provider global;
  - `apps/web/src/app/globals.css` para tokens/variáveis globais de tema;
  - `apps/web/src/presentation/components/layout/DashboardLayout.tsx` para toggle e superfícies globais do dashboard;
  - componentes de UI compartilhados (`Button`, `Input`, `Select`, `Modal`) quando necessário para contraste consistente;
  - páginas de autenticação (`login`, `register`) para que o tema alcance a área auth.
- Se páginas do dashboard tiverem muitas classes hardcoded, ajustar apenas superfícies necessárias para cumprir contraste e legibilidade global, sem refatoração visual ampla.
- Não modificar `apps/web/src/presentation/components/pdf/**`; componentes de PDF devem continuar com estilos independentes, inclusive botões de download podem ser tematizados se forem UI web, mas os documentos renderizados não.
- Não registrar decisão arquitetural separada, salvo se a implementação escolher trade-off relevante além da persistência local e atributo global.

## Data structures ou interfaces envolvidas

Não há alteração em contratos externos, entidades, schemas, endpoints ou payloads. As estruturas envolvidas são internas à apresentação:

- `Theme`:
  - valores permitidos: `'light' | 'dark'`.
- `ThemeContextValue` ou interface equivalente:
  - `theme: Theme`;
  - `setTheme(theme: Theme): void`;
  - `toggleTheme(): void`.
- Persistência local:
  - chave sugerida: `ppci-manager-theme`;
  - valores válidos: `light`, `dark`;
  - valor ausente ou inválido: tratado como `light`.
- Atributo global sugerido:
  - `data-theme="light"` ou `data-theme="dark"` no root document.

## Target files

- Criar/alterar preferencialmente:
  - `apps/web/src/presentation/contexts/theme.context.tsx` ou provider equivalente em apresentação;
  - `apps/web/src/app/layout.tsx`;
  - `apps/web/src/app/globals.css`;
  - `apps/web/src/presentation/components/layout/DashboardLayout.tsx`;
  - `apps/web/src/app/(auth)/login/page.tsx`;
  - `apps/web/src/app/(auth)/register/page.tsx`;
  - componentes compartilhados em `apps/web/src/presentation/components/ui/**`, apenas se necessário para contraste.
- Evitar:
  - `apps/web/src/domain/**`;
  - `apps/web/src/application/**`;
  - `apps/web/src/infrastructure/**`;
  - `supabase/**`;
  - `apps/web/src/presentation/components/pdf/quote-pdf.tsx`;
  - `apps/web/src/presentation/components/pdf/contract-pdf.tsx`.

## Critérios de aceite

- **AC-THEME-001**: Dado um navegador sem preferência persistida, quando a aplicação carregar, então o tema inicial deve ser claro.
- **AC-THEME-002**: Dado um navegador com `ppci-manager-theme=dark`, quando a aplicação carregar, então a UI de autenticação e dashboard deve renderizar em tema escuro.
- **AC-THEME-003**: Dado um navegador com `ppci-manager-theme=light`, quando a aplicação carregar, então a UI deve renderizar em tema claro.
- **AC-THEME-004**: Dado um valor persistido inválido, quando a aplicação carregar, então o tema deve voltar para `light` sem quebrar renderização.
- **AC-THEME-005**: Dado o usuário autenticado no dashboard, quando acessar o layout principal, então deve existir um toggle de tema visível e acessível.
- **AC-THEME-006**: Dado foco no toggle, quando o usuário usar teclado, então deve conseguir alternar entre claro e escuro sem mouse.
- **AC-THEME-007**: Dado uso de leitor de tela, quando o usuário navegar até o toggle, então o controle deve expor nome acessível e estado atual ou próxima ação de forma compreensível.
- **AC-THEME-008**: Dado o usuário alternar de claro para escuro, quando recarregar a página, então o tema escuro deve permanecer aplicado.
- **AC-THEME-009**: Dado o usuário alternar de escuro para claro, quando recarregar a página, então o tema claro deve permanecer aplicado.
- **AC-THEME-010**: Dado qualquer tela de autenticação (`login` ou `register`), quando o tema escuro estiver ativo, então fundo, texto, bordas, inputs e botões devem permanecer legíveis com contraste adequado.
- **AC-THEME-011**: Dado qualquer tela do dashboard, quando o tema escuro estiver ativo, então layout, navegação, cartões, tabelas, formulários, modais e estados de erro/sucesso ajustados devem permanecer legíveis.
- **AC-THEME-012**: Dado documentos PDF de orçamento ou contrato, quando o tema da aplicação mudar, então o visual do PDF gerado não deve mudar por causa do tema.
- **AC-THEME-013**: Dado o diff da implementação, então não deve haver alterações em domínio, aplicação, infraestrutura, API, Supabase, migrations ou contratos externos.
- **AC-THEME-014**: Dado inspeção do código, então não deve existir terceira opção de tema, opção “sistema”, leitura de `prefers-color-scheme` para definir tema inicial, nem tipo que aceite valor fora de `light | dark`.
- **AC-THEME-015**: Dado validação automatizada do workspace web, então lint, testes existentes e build devem passar sem introduzir violações de TypeScript estrito.

## Validation plan

Executar, no mínimo:

```bash
npm run lint --workspace @manager/web
npm run test --workspace @manager/web
npm run build --workspace @manager/web
```

Validação manual complementar:

- Limpar `localStorage` e confirmar inicialização em tema claro.
- Definir `ppci-manager-theme=dark`, recarregar e confirmar tema escuro em login, register e dashboard.
- Alternar pelo toggle do dashboard e confirmar persistência após reload.
- Testar navegação por teclado no toggle e conferir foco visível.
- Inspecionar nome/estado acessível do toggle com DevTools Accessibility ou leitor de tela.
- Revisar contraste visual em fundos, textos, inputs, tabelas, cards, navegação lateral, header mobile, modais e mensagens de erro.
- Gerar/visualizar PDFs de orçamento e contrato e confirmar que o documento não muda com o tema.
- Conferir o diff para garantir que alterações ficaram em apresentação e não tocaram domínio/aplicação/infra/Supabase.

## Riscos

- **Risco de classes hardcoded extensas**: muitas telas usam cores Tailwind explícitas. Mitigação: priorizar tokens globais e componentes compartilhados, ajustando páginas apenas onde contraste quebrar.
- **Risco de flash de tema inicial**: leitura de `localStorage` ocorre no cliente. Mitigação: aplicar atributo global cedo no provider ou script mínimo em apresentação, sem backend ou nova dependência.
- **Risco de afetar PDF**: estilos globais podem vazar para componentes web, mas PDFs devem permanecer independentes. Mitigação: não alterar componentes de documento PDF e validar geração em ambos os temas.
- **Risco de expansão de escopo**: tema pode induzir redesign amplo. Mitigação: limitar mudanças a cores/contraste e toggle, sem alterar fluxos ou layout estrutural.

## Open questions

- Resolvido: no desktop, o toggle de tema e a ação de sair devem ficar no header superior alinhados à direita; no mobile, o toggle permanece no header superior e a ação de sair permanece na sidebar para evitar excesso de ações no topo.
- O tema deve ser aplicado também enquanto a sessão/auth está carregando em `AuthProvider`, além de login/register/dashboard?
- Existe requisito mínimo formal de contraste (por exemplo WCAG AA) ou basta manter contraste adequado por revisão manual?
