import { randomUUID } from "node:crypto";
import { InMemoryPropertiesService, InMemorySession, InMemoryContext, SecurityPolicy, OAuthScope } from "@gasboost/fake-core";
import { NodeLockService } from "@gasboost/fake-node";

// Development-only bootstrap challenge; no production identity or credentials.
const email = process.env.GASBOOST_LOCAL_USER_EMAIL || "developer@localhost.invalid";
const token = randomUUID();
export const properties = new InMemoryPropertiesService({ script: {
  GASBOOST_SPREADSHEET_ID: "local",
  APP_STATE: JSON.stringify({ initialized: false, bootstrap: {
    token, email, expiresAt: Date.now() + 30 * 60_000, attempts: 0, notified: true,
  } }),
} });
export const runtime = {
  PropertiesService: properties,
  LockService: new NodeLockService({ scriptId: "local", userId: email }),
  Session: new InMemorySession(new InMemoryContext(email, email,
    { type: "WEB_APP", executeAs: "USER" }, new SecurityPolicy([OAuthScope.USERINFO_EMAIL]), "ja", "Asia/Tokyo")),
};
export function bootstrapState() {
  const state = JSON.parse(properties.getScriptProperties().getProperty("APP_STATE")!);
  return JSON.stringify({ initialized: state.initialized });
}
export function bootstrapUrl(base: string) {
  return base + "?token=" + encodeURIComponent(token) + "#/bootstrap";
}
