import { defineConfig } from 'vitest/config';

process.env.VITEST_NO_CLEAN_CONSOLE = 'true';

export default defineConfig({
  resolve: {
    alias: {
      '@minecraft/server': './node_modules/@minecraft/server/index.d.ts',
      '@minecraft/server-ui': './node_modules/@minecraft/server-ui/index.d.ts',
    },
  },
  test: {
    setupFiles: ['scripts/polyfills.ts'],
  }
});
