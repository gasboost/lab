import { AppsScript, type InferAppsScript } from "@gasboost/app";
import {
  authErrorHandler,
  authentication,
  authorization,
  handlers,
} from "@gasboost/auth-app";
import { officeManagement } from "../shared/policy";
import { auth, authorization as authorizationService } from "./lib/auth";
import { bootstrap } from "./lib/bootstrap";
import { templateValue } from "./lib/templateValue";
import { diMiddleware } from "./presentation/diMiddleware";
import {
  createOffice,
  listOffices,
  renameOffice,
  retireOffice,
} from "./presentation/OfficeRpc";

const officeAuthorization = authorization(
  authorizationService,
  officeManagement,
);

const app = new AppsScript()
  .get((request) => {
    // GAS template evaluation can normalize U+0085 in the bundled script.
    const html = HtmlService.createHtmlOutputFromFile("index").getContent();
    return HtmlService.createHtmlOutput(
      html.replace("<?!= __BOOTSTRAP__ ?>", () =>
        templateValue(bootstrap.handle(request)),
      ),
    ).setTitle("GAS BOOST");
  })
  .calls(bootstrap.handlers())
  .use(authErrorHandler())
  .calls(handlers(auth))
  .use(authentication(auth))
  .use(diMiddleware)
  .call("listOffices", listOffices, [officeAuthorization])
  .call("createOffice", createOffice, [officeAuthorization])
  .call("renameOffice", renameOffice, [officeAuthorization])
  .call("retireOffice", retireOffice, [officeAuthorization]);

export default app;
export type AppType = InferAppsScript<typeof app>;
