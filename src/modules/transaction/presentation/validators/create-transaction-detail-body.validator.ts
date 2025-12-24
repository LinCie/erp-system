import { z } from "@hono/zod-openapi";

const createTransactionDetailBodySchema = z
  .object({
    transaction_id: z.number().openapi({ example: 1 }),
    detail_type: z.string().optional().openapi({ example: "Item" }),
    detail_id: z.number().optional().openapi({ example: 1 }),
    model_type: z.string().optional().openapi({ example: "SO" }),
    model_id: z.number().optional().openapi({ example: 1 }),
    sku: z.string().optional().openapi({ example: "SKU-001" }),
    name: z.string().optional().openapi({ example: "Product Name" }),
    code: z.string().optional().openapi({ example: "PROD-001" }),
    quantity: z.string().openapi({ example: "10.00" }),
    price: z.string().openapi({ example: "100.00" }),
    discount: z.string().openapi({ example: "0.00" }),
    weight: z.string().optional().openapi({ example: "5.50" }),
    cost_per_unit: z.string().openapi({ example: "80.00" }),
    debit: z.string().openapi({ example: "10.00" }),
    credit: z.string().openapi({ example: "0.00" }),
    data: z.record(z.string(), z.unknown()).optional().openapi({
      example: { key: "value" },
    }),
    notes: z.string().optional().openapi({ example: "Additional notes" }),
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({
      example: "active",
    }),
  })
  .openapi("CreateTransactionDetailBody");

type CreateTransactionDetailBody = z.infer<
  typeof createTransactionDetailBodySchema
>;

export { createTransactionDetailBodySchema };
export type { CreateTransactionDetailBody };
