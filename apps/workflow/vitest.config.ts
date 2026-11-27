import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/mocks/runtime.ts", "./tests/mocks/db.ts"],
    passWithNoTests: true,
  },
});
