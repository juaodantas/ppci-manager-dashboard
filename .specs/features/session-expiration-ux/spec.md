# Session Expiration UX

## Context

O access token expira em 15 minutos e o refresh token em 30 dias. Hoje, quando a sessão expira ou o refresh falha, a aplicação reinicia a página via redirect hard, desmontando a tela atual e causando perda de dados ainda não enviados em formulários.

Esta feature existe para preservar o contexto visual e os dados em memória da página quando a autenticação precisa ser renovada ou quando a sessão expira de forma definitiva.

## Goals

- **REQ-001:** Renovar a sessão de forma proativa antes da expiração do access token, quando houver refresh token válido.
- **REQ-002:** Remover o redirect hard automático do interceptor de autenticação em falhas de refresh.
- **REQ-003:** Notificar a camada de apresentação sobre sessão expirada ou reautenticação necessária por callback, estado ou mecanismo equivalente existente no projeto.
- **REQ-004:** Exibir modal de sessão expirada/reautenticação mantendo a página atual montada.
- **REQ-005:** Preservar dados de formulário mantidos em memória pelo estado da tela enquanto o modal estiver aberto.
- **REQ-006:** Após relogin bem-sucedido, permitir que o usuário continue na tela atual e reenvie manualmente a operação desejada.
- **REQ-011:** Usar margem de 12 minutos para refresh proativo do access token.
- **REQ-012:** Modal de sessão expirada não deve exibir motivo/razão; deve incluir botão **Sair**.

## Non-goals / Fora de escopo

- **REQ-007:** Não implementar autosave, drafts, persistência local de formulários ou recuperação após reload/fechamento de aba.
- **REQ-008:** Não repetir mutations automaticamente após relogin.
- **REQ-009:** Não alterar a duração dos tokens.
- **REQ-010:** Não redesenhar o fluxo completo de autenticação além do necessário para refresh proativo, notificação de estado e modal.

## Technical approach and design decisions

- O cliente de autenticação deve tentar refresh proativo com margem fixa de 12 minutos, reduzindo a chance de falha durante edição ou envio de formulário.
- O interceptor não deve executar navegação destrutiva (`window.location`, reload ou redirect hard) quando o refresh falhar.
- A falha definitiva de refresh deve publicar um estado/evento de sessão expirada para a camada de apresentação.
- A camada de apresentação deve reagir a esse estado exibindo um modal bloqueante de reautenticação, sem desmontar a rota atual.
- O modal deve ser responsável apenas pela experiência de reautenticação e retomada da sessão; a decisão de reenviar mutations permanece com o usuário.
- O modal não deve exibir motivo/razão de expiração e deve oferecer ação explícita **Sair**.
- A feature deve reutilizar padrões existentes de autenticação, estado global, modal e formulários do projeto antes de introduzir novas abstrações.

## Data structures or interfaces involved

Interfaces conceituais esperadas, a adaptar aos padrões existentes:

- `AuthSessionState`
  - `status`: autenticada, renovando, expirada ou requer reautenticação.
  - `lastRefreshAttemptAt`: timestamp opcional para diagnóstico/controle.
- `AuthSessionCallbacks`
  - `onSessionExpired()`: chamado quando o refresh falha de forma definitiva.
  - `onSessionRestored()`: chamado após relogin ou refresh bem-sucedido.
- `SessionExpiredModalProps`
  - `open`: controla visibilidade.
  - `onReauthenticated`: retomada após login bem-sucedido.
  - `onLogout`: saída explícita, quando aplicável.

## Acceptance criteria

- **AC-001 / REQ-001:** Dado um access token próximo do vencimento, quando houver refresh token válido, então o sistema tenta renovar a sessão antes que uma request dependa de token expirado.
- **AC-002 / REQ-002:** Dada uma falha de refresh, quando o interceptor tratar o erro, então a página não sofre reload, `window.location` ou redirect hard automático.
- **AC-003 / REQ-003:** Dada uma falha definitiva de refresh, quando o estado/evento de sessão expirada for emitido, então a camada de apresentação consegue reagir sem acoplamento direto ao interceptor.
- **AC-004 / REQ-004:** Dada uma sessão expirada enquanto o usuário está em uma tela com formulário, quando o modal aparecer, então a rota e o componente da página permanecem montados.
- **AC-005 / REQ-005:** Dado um formulário preenchido antes da expiração, quando o modal de sessão expirada for exibido, então os valores mantidos no estado da tela continuam visíveis após fechar o modal por reautenticação bem-sucedida.
- **AC-006 / REQ-006, REQ-008:** Dada uma mutation que falhou por sessão expirada, quando o usuário relogar, então a mutation não é repetida automaticamente e o usuário precisa reenviar manualmente.
- **AC-007 / REQ-007:** Dado um reload manual, fechamento de aba ou navegação para fora da página, então a feature não promete recuperar dados de formulário por autosave/draft.
- **AC-008 / REQ-011:** Dado o refresh proativo, quando a rotina agendar a renovação, então a margem aplicada é de 12 minutos.
- **AC-009 / REQ-012:** Dado o modal de sessão expirada, então ele não exibe motivo/razão e inclui botão **Sair**.

## Gaps vs implementação atual

- O refresh proativo está implementado por intervalo fixo de 12 minutos, mas não utiliza a expiração real do access token como referência. Caso seja exigido refresh “antes do vencimento esperado”, é preciso decidir se a margem fixa é suficiente ou se o cronograma deve considerar o `exp` do token.
- O fluxo de bootstrap redireciona para `/login` quando o refresh falha e não existe access token. Isso não é um redirect hard, mas é uma navegação de rota que desmonta a tela atual. Confirmar se este comportamento está alinhado ao objetivo de manter a página montada apenas quando havia contexto em memória.

## Risks

- Refresh proativo mal sincronizado pode gerar múltiplas chamadas concorrentes de refresh.
- Um modal global de sessão expirada pode conflitar com modais já abertos se não seguir o padrão visual/estado existente.
- Manter a página montada preserva apenas estado em memória; componentes que limpam estado ao receber erro 401 podem ainda perder dados se não forem ajustados.
- Não repetir mutations automaticamente evita duplicidade, mas exige mensagem clara para o usuário reenviar a ação.

## Validation

- Validar typecheck/lint/build existentes após implementação.
- Testar manualmente o cenário de access token expirado com refresh token válido: a sessão deve ser renovada sem perda de contexto.
- Testar manualmente o cenário de refresh token inválido/expirado: modal deve abrir sem reload e sem desmontar a página.
- Testar manualmente um formulário preenchido durante expiração: valores em memória devem permanecer após reautenticação.
- Testar manualmente mutation falhando por sessão expirada: após relogin, a operação não deve ser reenviada automaticamente.

## Open questions

- Nenhuma.
