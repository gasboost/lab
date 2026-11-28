import { AUTH_ERROR_CODES } from "@gasboost/auth/errors";
import { AUTH_METADATA_KEY } from "@gasboost/auth-client/metadata";
import {
  InMemoryContext,
  InMemorySession,
  OAuthScope,
  SecurityPolicy,
} from "@gasboost/fake-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Office } from "../../src/backend/domain/Office";
import { officeTable } from "../../src/backend/infrastructure/officeTable";
import { SheetOfficeRepository } from "../../src/backend/infrastructure/SheetOfficeRepository";
import { auth, authorization } from "../../src/backend/lib/auth";
import { db } from "../../src/backend/lib/db";
import { container } from "../../src/backend/lib/di";
import { sheetGateway, spreadsheetId } from "../../src/backend/lib/sheets";
import app from "../../src/backend/main";

const sessions: string[] = [];

beforeEach(() => {
  const ids = db
    .table(officeTable.name)
    .find()
    .map(({ id }) => id);
  if (ids.length) db.table(officeTable.name).delete(ids);
});

afterEach(async () => {
  await Promise.all(sessions.splice(0).map((id) => auth.signOut.execute(id)));
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty("APP_STATE");
});

describe("Office", () => {
  it("keeps the ID and other attributes through rename and retirement", () => {
    const office = new Office("office-id", "本社");
    expect(office.status).toBe("active");

    office.rename("新本社");
    expect(office).toMatchObject({
      id: "office-id",
      name: "新本社",
      status: "active",
    });

    office.retire();
    expect(office).toMatchObject({
      id: "office-id",
      name: "新本社",
      status: "retired",
    });

    office.rename("旧本社");
    expect(office.status).toBe("retired");
  });
});

describe("Office persistence and use cases", () => {
  const offices = container.resolve("officeRepository");

  it("persists and restores the aggregate through a fresh repository", () => {
    const office = new Office(Utilities.getUuid(), "支店", "retired");
    offices.save(office);

    const restored = new SheetOfficeRepository(db).find({ id: office.id });
    expect(restored).toHaveLength(1);
    expect(restored[0]).toBeInstanceOf(Office);
    expect(restored[0]).toMatchObject({
      id: office.id,
      name: "支店",
      status: "retired",
    });
    expect(offices.find({ id: Utilities.getUuid() })).toEqual([]);
  });

  it("creates offices with distinct IDs and no fixed set of names", () => {
    const create = container.resolve("createOffice");
    const created = ["本社", "東営業所", "西営業所", "南営業所"].map(
      (name) => ({
        ...create.execute({ name }),
        name,
        status: "active",
      }),
    );

    expect(new Set(created.map(({ id }) => id)).size).toBe(4);
    expect(container.resolve("listOffices").execute()).toEqual(created);
  });

  it("renames a retired office without restoring it", () => {
    const id = Utilities.getUuid();
    offices.save(new Office(id, "営業所", "retired"));

    expect(
      container.resolve("renameOffice").execute({
        id,
        name: "旧営業所",
      }),
    ).toBe(true);
    expect(offices.find({ id })[0]).toMatchObject({
      id,
      name: "旧営業所",
      status: "retired",
    });
  });

  it("retires an office and keeps the same record on a retry", () => {
    const id = Utilities.getUuid();
    offices.save(new Office(id, "営業所"));
    const retire = container.resolve("retireOffice");

    expect(retire.execute({ id })).toBe(true);
    expect(retire.execute({ id })).toBe(true);
    expect(container.resolve("listOffices").execute()).toEqual([
      { id, name: "営業所", status: "retired" },
    ]);
    expect(retire.execute({ id: Utilities.getUuid() })).toBe(false);
  });
});

async function signIn(role?: "bootstrap" | "総務担当者") {
  const email = `${Utilities.getUuid()}@example.test`;
  const identity = new InMemorySession(
    new InMemoryContext(
      email,
      email,
      { type: "WEB_APP", executeAs: "USER" },
      new SecurityPolicy([OAuthScope.USERINFO_EMAIL]),
      "ja",
      "Asia/Tokyo",
    ),
  );
  const activeUser = vi
    .spyOn(Session, "getActiveUser")
    .mockImplementation(() => identity.getActiveUser());
  try {
    const effectiveUser = vi
      .spyOn(Session, "getEffectiveUser")
      .mockImplementation(() => identity.getEffectiveUser());
    try {
      if (role === "bootstrap") {
        const token = Utilities.getUuid();
        PropertiesService.getScriptProperties().setProperty(
          "APP_STATE",
          JSON.stringify({
            initialized: false,
            bootstrap: {
              token,
              email,
              expiresAt: Date.now() + 60_000,
              attempts: 0,
              notified: true,
            },
          }),
        );
        const initialized = await app.dispatch("initializeApp", { token });
        expect(JSON.parse(initialized.contents)).toEqual({ initialized: true });
      } else {
        const user = await auth.registration.appsScript({
          name: "テスト利用者",
          email,
        });
        if (role) await authorization.role.assign(user.id, role);
      }
      const { user, session } = await auth.signIn.appsScript({});
      sessions.push(session.id);
      return {
        userId: user.id,
        metadata: { [AUTH_METADATA_KEY]: { token: session.id } },
      };
    } finally {
      effectiveUser.mockRestore();
    }
  } finally {
    activeUser.mockRestore();
  }
}

describe("Office RPC", () => {
  it("performs the complete lifecycle for the administrator with no employee association", async () => {
    const { metadata } = await signIn("bootstrap");

    const initial = await app.dispatch("listOffices", undefined, metadata);
    expect(JSON.parse(initial.contents)).toEqual([]);

    const created = await app.dispatch(
      "createOffice",
      { name: " 本社 " },
      metadata,
    );
    const { id } = JSON.parse(created.contents);
    const listed = await app.dispatch("listOffices", undefined, metadata);
    expect(JSON.parse(listed.contents)).toEqual([
      { id, name: "本社", status: "active" },
    ]);

    await app.dispatch("renameOffice", { id, name: "新本社" }, metadata);
    await app.dispatch("retireOffice", { id }, metadata);
    const retired = await app.dispatch("listOffices", undefined, metadata);
    expect(JSON.parse(retired.contents)).toEqual([
      { id, name: "新本社", status: "retired" },
    ]);
  });

  it.each([
    ["listOffices", undefined],
    ["createOffice", { name: "本社" }],
    ["renameOffice", { id: "invalid", name: "本社" }],
    ["retireOffice", { id: "invalid" }],
  ] as const)(
    "checks authentication and permissions before %s",
    async (rpc, input) => {
      const { metadata } = await signIn();
      await expect(app.dispatch(rpc, input)).rejects.toThrow(
        AUTH_ERROR_CODES.UNAUTHORIZED,
      );
      await expect(app.dispatch(rpc, input, metadata)).rejects.toThrow(
        AUTH_ERROR_CODES.FORBIDDEN,
      );
      expect(container.resolve("listOffices").execute()).toEqual([]);
    },
  );

  it("rechecks permissions on every call from an existing session", async () => {
    const { userId, metadata } = await signIn("総務担当者");
    await expect(
      app.dispatch("listOffices", undefined, metadata),
    ).resolves.toBeDefined();

    await authorization.permission.deny(userId, "offices:manage");
    await expect(
      app.dispatch("listOffices", undefined, metadata),
    ).rejects.toThrow(AUTH_ERROR_CODES.FORBIDDEN);
  });

  it("rejects invalid input and missing offices", async () => {
    const { metadata } = await signIn("総務担当者");
    const id = Utilities.getUuid();
    await expect(
      app.dispatch("createOffice", { name: " " }, metadata),
    ).rejects.toThrow("INVALID_OFFICE_INPUT");
    await expect(
      app.dispatch("renameOffice", { id, name: "" }, metadata),
    ).rejects.toThrow("INVALID_OFFICE_INPUT");
    await expect(
      app.dispatch("retireOffice", { id: "invalid" }, metadata),
    ).rejects.toThrow("INVALID_OFFICE_INPUT");
    await expect(
      app.dispatch("renameOffice", { id, name: "本社" }, metadata),
    ).rejects.toThrow("OFFICE_NOT_FOUND");
    await expect(
      app.dispatch("retireOffice", { id }, metadata),
    ).rejects.toThrow("OFFICE_NOT_FOUND");
  });

  it("creates the office sheet during Bootstrap without migrating on office calls", async () => {
    const setColumns = vi.spyOn(sheetGateway, "setColumns");
    try {
      const { metadata } = await signIn("bootstrap");
      expect(setColumns).toHaveBeenCalledWith(spreadsheetId, officeTable.name, [
        "id",
        "name",
        "status",
      ]);
      setColumns.mockClear();

      await app.dispatch("listOffices", undefined, metadata);
      await app.dispatch("createOffice", { name: "本社" }, metadata);
      expect(setColumns).not.toHaveBeenCalled();
    } finally {
      setColumns.mockRestore();
    }
  });
});
