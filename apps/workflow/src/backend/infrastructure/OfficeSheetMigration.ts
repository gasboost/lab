import { officeSheet, sheetGateway } from "../lib/sheets";

export class OfficeSheetMigration {
  execute(): void {
    const properties = PropertiesService.getScriptProperties();
    const key = `WORKFLOW_OFFICES_SCHEMA_V1:${officeSheet.dbId}`;
    if (properties.getProperty(key)) return;

    // Serialize first access on upgraded deployments with other Office writes.
    const release = officeSheet.holdLock(
      CacheService.getScriptCache(),
      Utilities,
      LockService,
    );
    try {
      if (properties.getProperty(key)) return;
      sheetGateway.setColumns(
        officeSheet.dbId,
        officeSheet.name,
        officeSheet.schema.keyof().options,
      );
      properties.setProperty(key, "1");
    } finally {
      release();
    }
  }
}
