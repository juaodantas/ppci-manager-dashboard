import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@manager/domain': new URL('../../supabase/functions/_shared/domain/index.ts', import.meta.url).pathname,
    },
  },
})
