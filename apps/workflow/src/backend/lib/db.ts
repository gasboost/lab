import { SheetDB } from "@gasboost/sheetorm";
import { sheetGateway, sheetTables } from "./sheets";

export const db = new SheetDB({
  tables: sheetTables,
  gateway: sheetGateway,
  cacheService: CacheService,
  utilities: Utilities,
  lockService: LockService,
});
export type DB = typeof db;
