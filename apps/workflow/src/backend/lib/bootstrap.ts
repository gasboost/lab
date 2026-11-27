import { AppsScriptBootstrap } from "@gasboost/bootstrap";
import { auth, authorization, repository } from "./auth";
import { db } from "./db";

export const bootstrap = new AppsScriptBootstrap({
  db,
  auth,
  authorization,
  authRepository: repository,
});
