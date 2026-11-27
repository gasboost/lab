import { AppsScriptAuth, AppsScriptAuthorization } from "@gasboost/auth";
import {
  SheetOrmAuthorizationRepository,
  SheetOrmAuthRepository,
} from "@gasboost/auth-sheetorm";
import { policy } from "../../shared/policy";
import { authorizationTables, authTables } from "../../shared/tables";
import { db } from "./db";

export const repository = new SheetOrmAuthRepository({
  db,
  schema: authTables.schema,
});
export const authorization = new AppsScriptAuthorization({
  policy,
  repository: new SheetOrmAuthorizationRepository({
    db,
    schema: authorizationTables.schema,
  }),
});
export const auth = new AppsScriptAuth({
  repository,
  appsScript: { enabled: true, isSignupEnabled: false },
  runtime: {
    cacheService: CacheService,
    propertiesService: PropertiesService,
    session: Session,
    utilities: Utilities,
  },
  session: { storageType: "cache" },
  user: {
    data: async ({ user }) => ({
      permissions: await authorization.resolve(user.id),
    }),
  },
});
