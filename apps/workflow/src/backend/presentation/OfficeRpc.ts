import { AppsScriptError, type AppsScriptMiddleware } from "@gasboost/app";
import type { AuthState } from "@gasboost/auth-app";
import { z } from "zod";
import { officeName } from "../../shared/office";
import type {
  CreateOffice,
  ListOffices,
  RenameOffice,
  RetireOffice,
} from "../application/offices";

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

export class OfficeRpc {
  constructor(
    private readonly list: ListOffices,
    private readonly create: CreateOffice,
    private readonly rename: RenameOffice,
    private readonly retire: RetireOffice,
  ) {}

  listOffices = () => this.list.execute();

  createOffice = (input: z.input<typeof createInput>) => {
    const parsed = createInput.safeParse(input);
    if (!parsed.success) throw new AppsScriptError(invalidInput);

    return this.create.execute(parsed.data);
  };

  renameOffice = (input: z.input<typeof renameInput>) => {
    const parsed = renameInput.safeParse(input);
    if (!parsed.success) throw new AppsScriptError(invalidInput);

    if (!this.rename.execute(parsed.data)) throw new AppsScriptError(notFound);
    return null;
  };

  retireOffice = (input: z.input<typeof officeId>) => {
    const parsed = officeId.safeParse(input);
    if (!parsed.success) throw new AppsScriptError(invalidInput);

    if (!this.retire.execute(parsed.data)) throw new AppsScriptError(notFound);
    return null;
  };
}

export const migrateOfficeSheet =
  (migration: { execute(): void }): AppsScriptMiddleware<AuthState> =>
  (_context, next) => {
    migration.execute();
    return next();
  };
