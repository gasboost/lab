import { vi } from "vitest";

vi.mock("../../src/backend/lib/sheets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/backend/lib/sheets")>();
  const { InMemoryDataStore, InMemoryGateway } = await import("@gasboost/sheetorm");
  const store = new InMemoryDataStore(new Map(actual.sheetTables.map(table => [
    table.dbId + ":" + table.name, [Object.keys(table.schema.shape)],
  ])));
  return { ...actual, sheetGateway: new InMemoryGateway(store) };
});
