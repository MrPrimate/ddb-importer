import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/_setup/foundryMocks.ts"],
    environment: "node",
    // the lazy imports that break the config/parser import cycles on this branch load a large
    // module graph on first use, which can exceed the 5s default when workers run in parallel
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.mjs", "src/**/*.js"],
      exclude: ["src/types/**", "**/vendor/**", "src/**/_module.ts"],
      reporter: ["text-summary", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@client": path.resolve(__dirname, "foundry/client"),
      "@common": path.resolve(__dirname, "foundry/common"),
    },
  },
});
