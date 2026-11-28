import { Office } from "../domain/Office";

export interface OfficeRepository {
  find(criteria: { id?: string }): Office[];
  save(office: Office): void;
}

type Transaction = <T>(operation: () => T) => T;

export class ListOffices {
  constructor(private readonly offices: OfficeRepository) {}

  execute() {
    return this.offices.find({}).map(({ id, name, status }) => ({
      id,
      name,
      status,
    }));
  }
}

export class CreateOffice {
  constructor(
    private readonly offices: OfficeRepository,
    private readonly newId: () => string,
  ) {}

  execute({ name }: { name: string }) {
    const office = new Office(this.newId(), name);
    this.offices.save(office);
    return { id: office.id };
  }
}

export class RenameOffice {
  constructor(
    private readonly offices: OfficeRepository,
    private readonly transaction: Transaction,
  ) {}

  execute({ id, name }: { id: string; name: string }) {
    return this.transaction(() => {
      const [office] = this.offices.find({ id });
      if (!office) return false;

      office.rename(name);
      this.offices.save(office);
      return true;
    });
  }
}

export class RetireOffice {
  constructor(
    private readonly offices: OfficeRepository,
    private readonly transaction: Transaction,
  ) {}

  execute({ id }: { id: string }) {
    return this.transaction(() => {
      const [office] = this.offices.find({ id });
      if (!office) return false;

      office.retire();
      this.offices.save(office);
      return true;
    });
  }
}
