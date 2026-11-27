import {
  InMemoryCacheService,
  InMemoryContext,
  InMemoryPropertiesService,
  InMemorySession,
  SecurityPolicy,
} from "@gasboost/fake-core";
import { NodeLockService, NodeUtilities } from "@gasboost/fake-node";
import { SheetsStub, SpreadsheetAppStub } from "@gasboost/sheetorm";
import { vi } from "vitest";

vi.stubGlobal(
  "PropertiesService",
  new InMemoryPropertiesService({
    script: { GASBOOST_SPREADSHEET_ID: "integration-test" },
  }),
);
vi.stubGlobal("CacheService", new InMemoryCacheService());
vi.stubGlobal(
  "LockService",
  new NodeLockService({ scriptId: "integration-tests", userId: "test-user" }),
);
vi.stubGlobal("Utilities", new NodeUtilities());
vi.stubGlobal(
  "Session",
  new InMemorySession(
    new InMemoryContext(
      "",
      "",
      { type: "WEB_APP", executeAs: "USER" },
      new SecurityPolicy([]),
      "ja",
      "Asia/Tokyo",
    ),
  ),
);
vi.stubGlobal("SpreadsheetApp", SpreadsheetAppStub);
vi.stubGlobal("Sheets", SheetsStub);
