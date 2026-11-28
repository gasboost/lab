import { AuthorizationPolicy } from "@gasboost/auth/authorization";

export const officeManagement = { offices: ["manage"] } as const;
export const bootstrapAdministratorRole = "管理者";

export const policy = new AuthorizationPolicy(officeManagement)
  .linkRole(bootstrapAdministratorRole, officeManagement)
  .linkRole("総務担当者", officeManagement);
