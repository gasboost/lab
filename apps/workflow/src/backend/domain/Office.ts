export type OfficeStatus = "active" | "retired";

export class Office {
  readonly id: string;
  #name: string;
  #status: OfficeStatus;

  constructor(id: string, name: string, status: OfficeStatus = "active") {
    this.id = id;
    this.#name = name;
    this.#status = status;
  }

  get name() {
    return this.#name;
  }

  get status() {
    return this.#status;
  }

  rename(name: string) {
    this.#name = name;
  }

  retire() {
    this.#status = "retired";
  }
}
