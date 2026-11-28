import type { AppsScriptMiddleware } from "@gasboost/app";
import type { AuthState } from "@gasboost/auth-app";
import { container, type DiContainer } from "../lib/di";

export type DiState = {
  container: DiContainer;
};

export const diMiddleware: AppsScriptMiddleware<
  AuthState,
  AuthState & DiState
> = (context, next) => {
  context.state.set("container", container);
  return next();
};
