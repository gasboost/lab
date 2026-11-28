import { readFileSync } from "node:fs";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import app from "../../src/backend/main";

const placeholder = "<?!= __BOOTSTRAP__ ?>";
const moduleScript =
  '<script type="module">const compressed = "A\u0085B";</script>';
const indexHtml = readFileSync(
  new URL("../../index.html", import.meta.url),
  "utf8",
).replace(
  '<script type="module" src="/src/frontend/main.tsx"></script>',
  () => moduleScript,
);

afterEach(() => {
  PropertiesService.getScriptProperties().deleteProperty("APP_STATE");
  vi.restoreAllMocks();
});
afterAll(() => vi.unstubAllGlobals());

describe("doGet HTML delivery", () => {
  it.each([false, true])(
    "preserves the module script and embeds initialized=%s",
    (initialized) => {
      const email = "deployer@example.test";
      vi.spyOn(Session, "getEffectiveUser").mockReturnValue({
        getEmail: () => email,
        getUserLoginId: () => email,
      });
      PropertiesService.getScriptProperties().setProperty(
        "APP_STATE",
        JSON.stringify({
          initialized,
          ...(initialized
            ? {}
            : {
                bootstrap: {
                  email,
                  token: "test-token",
                  expiresAt: Date.now() + 60_000,
                  attempts: 0,
                  notified: true,
                },
              }),
        }),
      );

      const createHtmlOutputFromFile = vi.fn(() => ({
        getContent: () => indexHtml,
      }));
      const setTitle = vi.fn();
      const createHtmlOutput = vi.fn((content: string) => {
        const output = { getContent: () => content, setTitle };
        setTitle.mockReturnValue(output);
        return output;
      });
      vi.stubGlobal("HtmlService", {
        createHtmlOutputFromFile,
        createHtmlOutput,
      });

      const output = app.callGet({
        contextPath: "",
        pathInfo: "",
        contentLength: -1,
        queryString: "",
        parameter: {},
        parameters: {},
      });

      const html = output.getContent();
      expect(createHtmlOutputFromFile).toHaveBeenCalledExactlyOnceWith("index");
      expect(setTitle).toHaveBeenCalledExactlyOnceWith("GAS BOOST");
      expect(html).toContain(moduleScript);
      expect(html.replace(JSON.stringify({ initialized }), placeholder)).toBe(
        indexHtml,
      );
    },
  );
});
