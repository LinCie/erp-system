import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const itemResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Item" }),
    code: z.string().optional().openapi({ example: "ITEM-001" }),
    description: z.string().optional().openapi({
      example: "Item description",
    }),
    sku: z.string().optional().openapi({ example: "SKU-001" }),
    cost: z.string().openapi({ example: "10000" }),
    price: z.string().openapi({ example: "15000" }),
    weight: z.string().openapi({ example: "1.5" }),
    notes: z.string().optional().openapi({
      example: "Additional notes",
    }),
    status: z.string().openapi({ example: "active" }),
  })
  .openapi("ItemResponse");

const GetManyItemsResponseSchema = z.object({
  data: z.array(itemResponseSchema),
  metadata: getManyMetadataSchema,
});

export { GetManyItemsResponseSchema, itemResponseSchema };
