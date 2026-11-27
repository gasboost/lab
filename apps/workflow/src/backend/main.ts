import { AppsScript, type InferAppsScript } from "@gasboost/app";
import { authentication, authErrorHandler, handlers } from "@gasboost/auth-app";
import { auth } from "./lib/auth";
import { bootstrap } from "./lib/bootstrap";
import { templateValue } from "./lib/templateValue";


const app = new AppsScript()
  .get(request => {
    const template = HtmlService.createTemplateFromFile("index");
    template.__BOOTSTRAP__ = templateValue(bootstrap.handle(request));
    return template.evaluate().setTitle("GAS BOOST");
  })
  .calls(bootstrap.handlers())
  .use(authErrorHandler())
  .calls(handlers(auth))
  .use(authentication(auth))
;

export default app;
export type AppType = InferAppsScript<typeof app>;
