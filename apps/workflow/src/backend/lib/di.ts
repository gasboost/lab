import { asFunction, asValue, createContainer, InjectionMode } from "awilix";
import {
  CreateOffice,
  ListOffices,
  type OfficeRepository,
  RenameOffice,
  RetireOffice,
} from "../application/offices";
import { SheetOfficeRepository } from "../infrastructure/SheetOfficeRepository";
import { type DB, db } from "./db";

type Dependencies = {
  db: DB;
  officeRepository: OfficeRepository;
  listOffices: ListOffices;
  createOffice: CreateOffice;
  renameOffice: RenameOffice;
  retireOffice: RetireOffice;
};

export const container = createContainer<Dependencies>({
  injectionMode: InjectionMode.PROXY,
});

container.register({
  db: asValue(db),
  officeRepository: asFunction(
    ({ db }: Dependencies) => new SheetOfficeRepository(db),
  ).singleton(),
  listOffices: asFunction(
    ({ officeRepository }: Dependencies) => new ListOffices(officeRepository),
  ).singleton(),
  createOffice: asFunction(
    ({ officeRepository }: Dependencies) =>
      new CreateOffice(officeRepository, () => Utilities.getUuid()),
  ).singleton(),
  renameOffice: asFunction(
    ({ officeRepository, db }: Dependencies) =>
      new RenameOffice(officeRepository, (work) => db.transaction(work)),
  ).singleton(),
  retireOffice: asFunction(
    ({ officeRepository, db }: Dependencies) =>
      new RetireOffice(officeRepository, (work) => db.transaction(work)),
  ).singleton(),
});

export type DiContainer = typeof container;
