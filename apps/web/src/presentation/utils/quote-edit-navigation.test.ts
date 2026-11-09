import { describe, expect, it } from 'vitest'
import { editorLinkDecision, shouldGuardEditorUnload } from './quote-edit-navigation'

const dirty = { dirty: true, pending: false, saved: false }
const link = {
  href: '/customers', currentHref: 'http://localhost:3000/quotes/example/edit',
  target: '', download: false, button: 0, modified: false, defaultPrevented: false,
}

describe('scoped editor navigation guard', () => {
  it('confirms same-origin links including keyboard activation (click button 0)', () => {
    expect(editorLinkDecision(dirty, link)).toBe('confirm')
    expect(editorLinkDecision(dirty, { ...link, href: 'http://localhost:3000/quotes', target: '_self' })).toBe('confirm')
  })

  it('blocks outgoing links during pending even when the form is unchanged', () => {
    expect(editorLinkDecision({ ...dirty, dirty: false, pending: true }, link)).toBe('block')
    expect(editorLinkDecision({ ...dirty, pending: true }, link)).toBe('block')
    expect(shouldGuardEditorUnload({ ...dirty, dirty: false, pending: true })).toBe(true)
  })

  it('allows clean navigation and bypasses guards after successful save', () => {
    expect(editorLinkDecision({ ...dirty, dirty: false }, link)).toBe('allow')
    expect(shouldGuardEditorUnload({ ...dirty, dirty: false })).toBe(false)
    expect(editorLinkDecision({ ...dirty, pending: true, saved: true }, link)).toBe('allow')
    expect(shouldGuardEditorUnload({ ...dirty, pending: true, saved: true })).toBe(false)
    expect(shouldGuardEditorUnload(dirty)).toBe(true)
  })

  it.each([
    { modified: true }, // Ctrl/Meta/Shift/Alt: do not discard the current editor.
    { button: 1 },
    { target: '_blank' },
    { target: 'another-window' },
    { download: true },
    { defaultPrevented: true },
    { href: 'https://external.example/quotes' },
    { href: '#items' },
    { href: '/quotes/example/edit' },
  ])('leaves non-leaving, external or separately handled intent alone: %j', (intent) => {
    expect(editorLinkDecision(dirty, { ...link, ...intent })).toBe('allow')
    expect(editorLinkDecision({ ...dirty, pending: true }, { ...link, ...intent })).toBe('allow')
  })
})
