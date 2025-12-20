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
    price_discount: z.string().optional().openapi({ example: "5000" }),
    weight: z.string().openapi({ example: "1.5" }),
    notes: z.string().optional().openapi({
      example: "Additional notes",
    }),
    images: z.array(z.object({
      name: z.string().openapi({ example: "image.jpg" }),
      path: z.string().openapi({ example: "/items/image.webp" }),
      size: z.number().openapi({ example: 1024 }),
      isNew: z.boolean().optional().openapi({ example: true }),
    })).optional().openapi("Images"),
    files: z.array(z.object({
      name: z.string().openapi({ example: "product.pdf" }),
      path: z.string().openapi({ example: "/items/product.pdf" }),
      size: z.number().openapi({ example: 1024 }),
    })).optional().openapi("Files"),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
    space_id: z.coerce.number().openapi({ example: 1 }),
  })
  .openapi("CreateItemBody");

type CreateItemBody = z.infer<typeof createItemBodySchema>;

export { createItemBodySchema };
export type { CreateItemBody };
