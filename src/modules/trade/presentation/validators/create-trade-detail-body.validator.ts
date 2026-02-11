import { z } from "@hono/zod-openapi";

/**
 * Validator for creating a trade detail (line item)
 * Requires itemId which will be mapped to detail_id with detail_type='ITM'
 */
const createTradeDetailBodySchema = z
  .object({
    itemId: z.coerce.number().openapi({ example: 1 }),
    modelType: z.string().openapi({ example: "SO" }),
    quantity: z.number().openapi({ example: 10 }),
    price: z.number().openapi({ example: 15000 }),
    discount: z.number().optional().openapi({ example: 0 }),
    weight: z.number().optional().openapi({ example: 1.50 }),
    sku: z.string().optional().openapi({ example: "SKU-001" }),
    name: z.string().optional().openapi({ example: "Product Name" }),
    notes: z.string().optional().openapi({ example: "Detail notes" }),
  })
  .strict()
  .openapi("CreateTradeDetailBody");

type CreateTradeDetailBody = z.infer<typeof createTradeDetailBodySchema>;

export { createTradeDetailBodySchema };
export type { CreateTradeDetailBody };
