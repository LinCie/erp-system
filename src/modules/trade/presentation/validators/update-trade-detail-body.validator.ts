import { z } from "@hono/zod-openapi";

/**
 * Validator for updating a trade detail (line item)
 * Excludes transaction_id, detail_type, and detail_id (immutable linking fields)
 */
const updateTradeDetailBodySchema = z
  .object({
    model_type: z.string().optional().openapi({ example: "SO" }),
    quantity: z.number().optional().openapi({ example: 10 }),
    price: z.number().optional().openapi({ example: 15000 }),
    discount: z.number().optional().openapi({ example: 0 }),
    weight: z.number().optional().openapi({ example: 1.50 }),
    sku: z.string().optional().openapi({ example: "SKU-001" }),
    name: z.string().optional().openapi({ example: "Product Name" }),
    notes: z.string().optional().openapi({ example: "Detail notes" }),
  })
  .strict()
  .openapi("UpdateTradeDetailBody");

type UpdateTradeDetailBody = z.infer<typeof updateTradeDetailBodySchema>;

export { updateTradeDetailBodySchema };
export type { UpdateTradeDetailBody };
