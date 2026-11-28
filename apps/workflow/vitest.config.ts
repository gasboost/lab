import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src/frontend", import.meta.url)) },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/mocks/runtime.ts", "./tests/mocks/db.ts"],
    passWithNoTests: true,
  },
});
