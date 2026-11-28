// @vitest-environment jsdom

import { BootstrapProvider } from "@gasboost/bootstrap/react";
import { AppsScriptRpcError } from "@gasboost/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppType } from "../../src/backend/main";
import { AuthApp } from "../../src/frontend/components/AuthApp";
import { routes } from "../../src/shared/routes";

const { api, auth } = vi.hoisted(() => ({
  api: {
    listOffices: vi.fn(),
    createOffice: vi.fn(),
    renameOffice: vi.fn(),
    retireOffice: vi.fn(),
  },
  auth: {
    user: {
      id: "manager",
      name: "総務",
      data: { permissions: ["offices:manage"] },
    },
    isLoading: false,
    isSessionRestoreFailed: false,
  },
}));

vi.mock("../../src/frontend/lib/auth-rpc", () => ({ client: api }));
vi.mock("../../src/frontend/contexts/AuthContext", () => ({
  useAuth: () => auth,
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

let queryClient: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  auth.user.data.permissions = ["offices:manage"];
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});
afterEach(() => {
  cleanup();
  queryClient.clear();
});

function renderApp(entry: string = routes.offices) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[entry]}>
      <QueryClientProvider client={queryClient}>
        <BootstrapProvider initialState={{ initialized: true }}>
          <AuthApp />
        </BootstrapProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return user;
}

describe("拠点管理画面", () => {
  it("新設・名称変更・廃止の結果を一覧に表示する", async () => {
    let offices: AppType["listOffices"]["result"] = [];
    api.listOffices.mockImplementation(async () => offices);
    api.createOffice.mockImplementation(async ({ name }) => {
      offices = [{ id: "office-1", name, status: "active" }];
      return { id: "office-1" };
    });
    api.renameOffice.mockImplementation(async ({ id, name }) => {
      offices = [{ id, name, status: "active" }];
    });
    api.retireOffice.mockImplementation(async ({ id }) => {
      offices = offices.map((office) =>
        office.id === id ? { ...office, status: "retired" } : office,
      );
    });

    const user = renderApp(routes.home);
    await user.click(screen.getByRole("link", { name: "拠点管理" }));
    await screen.findByText("登録済みの拠点はありません。");

    await user.click(screen.getByRole("button", { name: "新設する" }));
    await screen.findByText("拠点名を入力してください。");
    expect(api.createOffice).not.toHaveBeenCalled();

    const name = screen.getByRole("textbox", { name: "拠点名" });
    await user.type(name, " 本社 ");
    await user.click(screen.getByRole("button", { name: "新設する" }));
    expect(api.createOffice).toHaveBeenCalledWith({ name: "本社" });
    const active = await screen.findByRole("row", { name: /本社 有効/ });

    await user.click(within(active).getByRole("button", { name: "名称変更" }));
    await user.clear(name);
    await user.type(name, "新本社");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));
    expect(api.renameOffice).toHaveBeenCalledWith({
      id: "office-1",
      name: "新本社",
    });
    const renamed = await screen.findByRole("row", { name: /新本社 有効/ });

    await user.click(within(renamed).getByRole("button", { name: "廃止" }));
    expect(api.retireOffice).not.toHaveBeenCalled();
    await user.click(within(renamed).getByRole("button", { name: "廃止する" }));
    expect(api.retireOffice).toHaveBeenCalledWith({ id: "office-1" });
    const retired = await screen.findByRole("row", { name: /新本社 廃止/ });
    expect(within(retired).queryByRole("button", { name: "廃止" })).toBeNull();
  });

  it("権限がない利用者の直接アクセスを拒否する", async () => {
    auth.user.data.permissions = [];
    renderApp();
    await screen.findByRole("heading", { name: "アクセス権限がありません" });
    expect(api.listOffices).not.toHaveBeenCalled();
  });

  it("一覧取得エラーを再試行でき、廃止エラー時は有効のまま表示する", async () => {
    api.listOffices
      .mockRejectedValueOnce(new Error("connection"))
      .mockResolvedValue([{ id: "office-1", name: "本社", status: "active" }]);
    api.retireOffice.mockRejectedValue(
      new AppsScriptRpcError({
        code: "OFFICE_NOT_FOUND",
        message: "拠点が見つかりませんでした。",
      }),
    );

    const user = renderApp();
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "再読み込み" }));
    const active = await screen.findByRole("row", { name: /本社 有効/ });

    await user.click(within(active).getByRole("button", { name: "廃止" }));
    await user.click(within(active).getByRole("button", { name: "廃止する" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "拠点が見つかりませんでした。",
    );
    expect(screen.getByRole("row", { name: /本社 有効/ })).toBe(active);
  });
});
