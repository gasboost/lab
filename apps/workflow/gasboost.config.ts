import { defineGasboostConfig } from "@gasboost/config";

export default defineGasboostConfig({
  appsScript: { type: "webapp", rootDir: "./dist" },
});
