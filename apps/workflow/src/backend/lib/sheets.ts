import { SheetGateway, SheetTable } from "@gasboost/sheetorm";
import { authTables, authorizationTables } from "../../shared/tables";

function resolveSpreadsheetId(): string {
  const configured = PropertiesService.getScriptProperties().getProperty("GASBOOST_SPREADSHEET_ID");
  const id = configured || SpreadsheetApp.getActive()?.getId();
  if (!id) throw new Error("Set GASBOOST_SPREADSHEET_ID in Script Properties.");
  return id;
}
export const spreadsheetId = resolveSpreadsheetId();
export const sheetTables = [
  new SheetTable({ ...authTables.user, dbId: spreadsheetId }),
  new SheetTable({ ...authTables.account, dbId: spreadsheetId }),
  new SheetTable({ ...authTables.passwordReset, dbId: spreadsheetId }),
  new SheetTable({ ...authorizationTables.role, dbId: spreadsheetId }),
  new SheetTable({ ...authorizationTables.permission, dbId: spreadsheetId }),
] as const;
export const sheetGateway = new SheetGateway(Sheets!);
