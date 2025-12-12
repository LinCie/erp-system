import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "../../../../shared/presentation/schemas/get-many-metadata.schema.ts";

const itemResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Item" }),
    code: z.string().nullish().optional().openapi({ example: "ITEM-001" }),
    description: z.string().nullish().optional().openapi({
      example: "Item description",
    }),
    sku: z.string().nullish().optional().openapi({ example: "SKU-001" }),
    cost: z.string().openapi({ example: "10000" }),
    price: z.string().openapi({ example: "15000" }),
    weight: z.string().openapi({ example: "1.5" }),
    notes: z.string().nullish().optional().openapi({
      example: "Additional notes",
    }),
    model_id: z.number().nullish().optional().openapi({ example: 1 }),
    model_type: z.string().nullish().optional().openapi({
      example: "App\\Models\\Model",
    }),
    parent_id: z.number().nullish().optional().openapi({ example: null }),
    parent_type: z.string().nullish().optional().openapi({ example: null }),
    space_id: z.number().nullish().optional().openapi({ example: 1 }),
    space_type: z.string().nullish().optional().openapi({
      example: "App\\Models\\Space",
    }),
    type_id: z.number().nullish().optional().openapi({ example: 1 }),
    type_type: z.string().nullish().optional().openapi({
      example: "App\\Models\\Variable",
    }),
    primary_code: z.string().nullish().optional().openapi({
      example: "PRIMARY-001",
    }),
    status: z.string().openapi({ example: "active" }),
    created_at: z.string().datetime().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
    updated_at: z.string().datetime().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
  })
  .openapi("ItemResponse");

const GetManyItemsResponseSchema = z.object({
  data: z.array(itemResponseSchema),
  metadata: getManyMetadataSchema,
});

export { GetManyItemsResponseSchema, itemResponseSchema };
