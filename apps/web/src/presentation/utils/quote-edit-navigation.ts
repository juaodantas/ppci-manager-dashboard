interface EditorNavigationState {
  dirty: boolean
  pending: boolean
  saved: boolean
}

interface EditorLinkIntent {
  href: string
  currentHref: string
  target: string
  download: boolean
  button: number
  modified: boolean
  defaultPrevented: boolean
}

export function shouldGuardEditorUnload(state: EditorNavigationState): boolean {
  return !state.saved && (state.dirty || state.pending)
}

export function editorLinkDecision(state: EditorNavigationState, intent: EditorLinkIntent): 'allow' | 'confirm' | 'block' {
  if (!shouldGuardEditorUnload(state) || intent.defaultPrevented || intent.button !== 0 || intent.modified ||
    intent.download || (intent.target && intent.target.toLowerCase() !== '_self')) return 'allow'
  const destination = new URL(intent.href, intent.currentHref)
  const current = new URL(intent.currentHref)
  if (destination.origin !== current.origin ||
    (destination.pathname === current.pathname && destination.search === current.search)) return 'allow'
  return state.pending ? 'block' : 'confirm'
}
