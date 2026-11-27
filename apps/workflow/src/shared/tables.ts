import { createAuthorizationTables, createAuthTables } from "@gasboost/auth";

export const authTables = createAuthTables();
export const authorizationTables = createAuthorizationTables();
export const tables = [
  authTables.user,
  authTables.account,
  authTables.passwordReset,
  authorizationTables.role,
  authorizationTables.permission,
] as const;
