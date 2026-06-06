import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@minecraft/server": "./node_modules/@minecraft/server/index.d.ts",
      "@minecraft/server-ui": "./node_modules/@minecraft/server-ui/index.d.ts",
    },
  },
  test: {
    setupFiles: ["scripts/polyfills.ts"],
  },
});
