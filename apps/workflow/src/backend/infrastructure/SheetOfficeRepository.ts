import type { OfficeRepository } from "../application/offices";
import { Office } from "../domain/Office";
import type { DB } from "../lib/db";
import { officeTable } from "./officeTable";

export class SheetOfficeRepository implements OfficeRepository {
  constructor(private readonly db: DB) {}

  find({ id }: { id?: string }): Office[] {
    const query = this.db.query(officeTable.name);
    if (id !== undefined) query.and("id", "=", [id]);

    return this.db.find(query).map((record) => {
      const { id, name, status } = officeTable.schema.parse(record);
      return new Office(id, name, status);
    });
  }

  save({ id, name, status }: Office): void {
    this.db.table(officeTable.name).upsert([{ id, name, status }]);
  }
}
