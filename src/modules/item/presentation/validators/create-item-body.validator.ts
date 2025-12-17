import { z } from "@hono/zod-openapi";

const createItemBodySchema = z
  .object({
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
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
    space_id: z.coerce.number().openapi({ example: 1 }),
  })
  .openapi("CreateItemBody");

const createItemFormSchema = z
  .object({
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
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
    space_id: z.coerce.number().openapi({ example: 1 }),
    images: z
      .union([z.instanceof(File), z.array(z.instanceof(File))])
      .optional()
      .openapi({ type: "string", format: "binary" }),
  })
  .openapi("CreateItemForm");

type CreateItemBody = z.infer<typeof createItemBodySchema>;
type CreateItemForm = z.infer<typeof createItemFormSchema>;

export { createItemBodySchema, createItemFormSchema };
export type { CreateItemBody, CreateItemForm };
