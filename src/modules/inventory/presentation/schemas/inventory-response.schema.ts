import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const inventoryResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Inventory" }),
    status: z.string().openapi({ example: "active" }),
  })
  .openapi("InventoryResponse");

const getManyInventoriesResponseSchema = z.object({
  data: z.array(inventoryResponseSchema),
  metadata: getManyMetadataSchema,
}).openapi("GetManyInventoriesResponse");

export { inventoryResponseSchema, getManyInventoriesResponseSchema };
