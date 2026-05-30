import { describe, expect, it } from 'vitest'
import { parseTheme } from '../presentation/contexts/theme.context'

describe('theme parsing', () => {
  it('accepts only light and dark theme values', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('dark')).toBe('dark')
  })

  it('falls back to light when persisted theme is missing or invalid', () => {
    expect(parseTheme(null)).toBe('light')
    expect(parseTheme('')).toBe('light')
    expect(parseTheme('system')).toBe('light')
    expect(parseTheme('prefers-color-scheme')).toBe('light')
  })
})
