import { fileURLToPath } from "node:url";
import { NodeLockService } from "@gasboost/fake-node";
import { SheetsStub, SpreadsheetAppStub } from "@gasboost/sheetorm";
import { gasboost } from "@gasboost/vite";
import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { officeTable } from "./src/backend/infrastructure/officeTable";
import { tables } from "./src/shared/tables";

export default defineConfig(async ({ command }) => {
  const serving = command === "serve";
  const local = serving ? await import("./dev/runtime") : undefined;

  const { build, dev } = gasboost({
    entry: "src/backend/main.ts",
    localRpc: {
      override: true,
      database: {
        local: Object.fromEntries(
          [...tables, officeTable].map((table) => [table.name, []]),
        ),
      },
    },
    runtime: {
      SpreadsheetApp: SpreadsheetAppStub,
      Sheets: SheetsStub,
      ...(local?.runtime ?? {
        LockService: new NodeLockService({
          scriptId: "build",
          userId: "build",
        }),
      }),
    },
  });
  const bootstrap: Plugin = {
    name: "local-bootstrap",
    apply: "serve",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => {
        if (!local) {
          throw new Error("Local runtime is not initialized");
        }

        return html.replace("<?!= __BOOTSTRAP__ ?>", () =>
          local.bootstrapState(),
        );
      },
    },
    configureServer(server) {
      const httpServer = server.httpServer;

      if (!httpServer || !local) return;

      httpServer.once("listening", () => {
        const address = httpServer.address();

        if (address && typeof address !== "string") {
          console.log(
            `Local bootstrap: ${local.bootstrapUrl(`http://localhost:${address.port}/`)}`,
          );
        }
      });
    },
  };
  if (!serving && process.env.BUILD_TARGET === "server") {
    return { plugins: [build], build: { outDir: "dist", emptyOutDir: false } };
  }
  return {
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src/frontend", import.meta.url)) },
    },
    plugins: [
      react(),
      tailwind(),
      viteSingleFile(),
      ...(serving ? [dev, bootstrap] : []),
    ],
    build: { outDir: "dist", emptyOutDir: false },
  };
});
