import { AppsScriptBootstrap } from "@gasboost/bootstrap";
import { bootstrapAdministratorRole } from "../../shared/policy";
import { auth, authorization, repository } from "./auth";
import { db } from "./db";

export const bootstrap = new AppsScriptBootstrap({
  db,
  administrator: { role: bootstrapAdministratorRole },
  auth,
  authorization,
  authRepository: repository,
});
