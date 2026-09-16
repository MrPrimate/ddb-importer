import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/_setup/foundryMocks.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.mjs", "src/**/*.js"],
      exclude: ["src/types/**", "**/vendor/**", "src/**/_module.ts"],
      reporter: ["text-summary", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@client": path.resolve(import.meta.dirname, "foundry/client"),
      "@common": path.resolve(import.meta.dirname, "foundry/common"),
    },
  },
});
