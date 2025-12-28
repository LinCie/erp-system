import { z } from "@hono/zod-openapi";
import { createInventoryBodySchema } from "./create-inventory-body.validator.ts";

const updateInventoryBodySchema = createInventoryBodySchema.partial().openapi(
  "UpdateInventoryBody",
);

type UpdateInventoryBody = z.infer<typeof updateInventoryBodySchema>;

export { updateInventoryBodySchema };
export type { UpdateInventoryBody };
