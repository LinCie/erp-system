import { z } from "@hono/zod-openapi";

const transactionDetailResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
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
    status: z.string().openapi({ example: "active" }),
    created_at: z.coerce.date().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
    updated_at: z.coerce.date().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
    deleted_at: z.coerce.date().optional().openapi({ example: null }),
  })
  .openapi("TransactionDetailResponse");

export { transactionDetailResponseSchema };
