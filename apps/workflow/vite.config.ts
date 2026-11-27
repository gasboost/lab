import { defineConfig, type Plugin } from "vite";
import { gasboost } from "@gasboost/vite";
import { NodeLockService } from "@gasboost/fake-node";
import { SpreadsheetAppStub, SheetsStub } from "@gasboost/sheetorm";
import { tables } from "./src/shared/tables";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

export default defineConfig(async ({ command }) => {
  const serving = command === "serve";
  const local = serving ? await import("./dev/runtime") : undefined;

  const { build, dev } = gasboost({
    entry: "src/backend/main.ts",
    localRpc: { override: true, database: { local: Object.fromEntries(tables.map(table => [table.name, []])) } },
    runtime: { SpreadsheetApp: SpreadsheetAppStub, Sheets: SheetsStub,
      ...(local?.runtime ?? { LockService: new NodeLockService({ scriptId: "build", userId: "build" }) })  },
  });
  const bootstrap: Plugin = {
    name: "local-bootstrap", apply: "serve",
    transformIndexHtml: { order: "pre", handler: html => html.replace("<?!= __BOOTSTRAP__ ?>", () => local!.bootstrapState()) },
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        const address = server.httpServer!.address();
        if (address && typeof address !== "string") console.log("Local bootstrap: " + local!.bootstrapUrl("http://localhost:" + address.port + "/"));
      });
    },
  };
  if (!serving && process.env.BUILD_TARGET === "server") {
    return { plugins: [build], build: { outDir: "dist", emptyOutDir: false } };
  }
  return {
    resolve: { alias: { "@": fileURLToPath(new URL("./src/frontend", import.meta.url)) } },
    plugins: [react(), tailwind(), viteSingleFile(), ...(serving ? [dev, bootstrap] : [])],
    build: { outDir: "dist", emptyOutDir: false },
  };
});
