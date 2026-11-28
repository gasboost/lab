import { SheetGateway, SheetTable } from "@gasboost/sheetorm";
import { authorizationTables, authTables } from "../../shared/tables";
import { officeTable } from "../infrastructure/officeTable";

function resolveSpreadsheetId(): string {
  const configured = PropertiesService.getScriptProperties().getProperty(
    "GASBOOST_SPREADSHEET_ID",
  );
  const id = configured || SpreadsheetApp.getActive()?.getId();
  if (!id) throw new Error("Set GASBOOST_SPREADSHEET_ID in Script Properties.");
  return id;
}
export const spreadsheetId = resolveSpreadsheetId();
export const officeSheet = new SheetTable({
  ...officeTable,
  dbId: spreadsheetId,
});
export const sheetTables = [
  new SheetTable({ ...authTables.user, dbId: spreadsheetId }),
  new SheetTable({ ...authTables.account, dbId: spreadsheetId }),
  new SheetTable({ ...authTables.passwordReset, dbId: spreadsheetId }),
  new SheetTable({ ...authorizationTables.role, dbId: spreadsheetId }),
  new SheetTable({ ...authorizationTables.permission, dbId: spreadsheetId }),
  officeSheet,
] as const;

// biome-ignore lint/style/noNonNullAssertion: Sheets API is enabled in appsscript.json.
export const sheetGateway = new SheetGateway(Sheets!);
