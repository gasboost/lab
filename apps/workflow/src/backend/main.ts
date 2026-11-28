import { AppsScript, type InferAppsScript } from "@gasboost/app";
import {
  authErrorHandler,
  authentication,
  authorization,
  handlers,
} from "@gasboost/auth-app";
import { officeManagement } from "../shared/policy";
import {
  CreateOffice,
  ListOffices,
  RenameOffice,
  RetireOffice,
} from "./application/offices";
import { OfficeSheetMigration } from "./infrastructure/OfficeSheetMigration";
import { SheetOfficeRepository } from "./infrastructure/SheetOfficeRepository";
import { auth, authorization as authorizationService } from "./lib/auth";
import { bootstrap } from "./lib/bootstrap";
import { db } from "./lib/db";
import { templateValue } from "./lib/templateValue";
import { migrateOfficeSheet, OfficeRpc } from "./presentation/OfficeRpc";

const offices = new SheetOfficeRepository(db);
const transaction = db.transaction.bind(db);
const officeRpc = new OfficeRpc(
  new ListOffices(offices),
  new CreateOffice(offices, () => Utilities.getUuid()),
  new RenameOffice(offices, transaction),
  new RetireOffice(offices, transaction),
);
const officeMiddleware = [
  authorization(authorizationService, officeManagement),
  migrateOfficeSheet(new OfficeSheetMigration()),
] as const;

const app = new AppsScript()
  .get((request) => {
    const template = HtmlService.createTemplateFromFile("index");
    template.__BOOTSTRAP__ = templateValue(bootstrap.handle(request));
    return template.evaluate().setTitle("GAS BOOST");
  })
  .calls(bootstrap.handlers())
  .use(authErrorHandler())
  .calls(handlers(auth))
  .use(authentication(auth))
  .call("listOffices", officeRpc.listOffices, officeMiddleware)
  .call("createOffice", officeRpc.createOffice, officeMiddleware)
  .call("renameOffice", officeRpc.renameOffice, officeMiddleware)
  .call("retireOffice", officeRpc.retireOffice, officeMiddleware);

export default app;
export type AppType = InferAppsScript<typeof app>;
