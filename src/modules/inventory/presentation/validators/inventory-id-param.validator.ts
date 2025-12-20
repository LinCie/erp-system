import { z } from "@hono/zod-openapi";

const inventoryIdParamSchema = z
  .object({
    id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
  })
  .openapi("InventoryIdParam");

type InventoryIdParams = z.infer<typeof inventoryIdParamSchema>;

export { inventoryIdParamSchema };
export type { InventoryIdParams };
