export type OfficeStatus = "active" | "retired";

export class Office {
  readonly id: string;
  private currentName: string;
  private currentStatus: OfficeStatus;

  constructor(id: string, name: string, status: OfficeStatus = "active") {
    this.id = id;
    this.currentName = name;
    this.currentStatus = status;
  }

  get name() {
    return this.currentName;
  }

  get status() {
    return this.currentStatus;
  }

  rename(name: string) {
    this.currentName = name;
  }

  retire() {
    this.currentStatus = "retired";
  }
}
