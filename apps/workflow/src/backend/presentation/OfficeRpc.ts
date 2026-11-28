import { type AppsScriptContext, AppsScriptError } from "@gasboost/app";
import type { AuthState } from "@gasboost/auth-app";
import { z } from "zod";
import { officeName } from "../../shared/office";
import type { DiState } from "./diMiddleware";

type OfficeRpcState = AuthState & DiState;
type OfficeRpcContext = AppsScriptContext<OfficeRpcState, OfficeRpcState>;

const officeId = z.object({ id: z.uuid() });
const createInput = z.object({ name: officeName });
const renameInput = officeId.extend(createInput.shape);

const invalidInput = {
  code: "INVALID_OFFICE_INPUT",
  message: "拠点の入力内容を確認してください。",
};
const notFound = {
  code: "OFFICE_NOT_FOUND",
  message: "拠点が見つかりませんでした。",
};

export function listOffices(_input: undefined, context: OfficeRpcContext) {
  return context.state.get("container").resolve("listOffices").execute();
}

export function createOffice(
  input: z.input<typeof createInput>,
  context: OfficeRpcContext,
) {
  const parsed = createInput.safeParse(input);
  if (!parsed.success) throw new AppsScriptError(invalidInput);

  return context.state
    .get("container")
    .resolve("createOffice")
    .execute(parsed.data);
}

export function renameOffice(
  input: z.input<typeof renameInput>,
  context: OfficeRpcContext,
) {
  const parsed = renameInput.safeParse(input);
  if (!parsed.success) throw new AppsScriptError(invalidInput);

  const renamed = context.state
    .get("container")
    .resolve("renameOffice")
    .execute(parsed.data);
  if (!renamed) throw new AppsScriptError(notFound);
  return null;
}

export function retireOffice(
  input: z.input<typeof officeId>,
  context: OfficeRpcContext,
) {
  const parsed = officeId.safeParse(input);
  if (!parsed.success) throw new AppsScriptError(invalidInput);

  const retired = context.state
    .get("container")
    .resolve("retireOffice")
    .execute(parsed.data);
  if (!retired) throw new AppsScriptError(notFound);
  return null;
}
