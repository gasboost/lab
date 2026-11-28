import { defineTable } from "@gasboost/table";
import { z } from "zod";

export const officeTable = defineTable({
  name: "offices",
  primaryKey: "id",
  schema: z.object({
    id: z.uuid(),
    name: z.string().min(1),
    status: z.enum(["active", "retired"]),
  }),
});
