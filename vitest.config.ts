import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/_setup/foundryMocks.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@client": path.resolve(__dirname, "foundry/client"),
      "@common": path.resolve(__dirname, "foundry/common"),
    },
  },
});
