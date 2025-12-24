import { z } from "@hono/zod-openapi";
import { updateTransactionBodySchema } from "./update-transaction-body.validator.ts";
import { createTransactionDetailBodySchema } from "./create-transaction-detail-body.validator.ts";

const updateTransactionWithDetailsBodySchema = z
  .object({
    transaction: updateTransactionBodySchema,
    details: z.array(
      createTransactionDetailBodySchema.omit({ transaction_id: true }),
    ).openapi({
      example: [
        {
          model_type: "SO",
          sku: "SKU-001",
          name: "Product 1",
          quantity: "5.00",
          price: "100.00",
          discount: "0.00",
          cost_per_unit: "80.00",
          debit: "5.00",
          credit: "0.00",
        },
      ],
    }),
  })
  .openapi("UpdateTransactionWithDetailsBody");

type UpdateTransactionWithDetailsBody = z.infer<
  typeof updateTransactionWithDetailsBodySchema
>;

export { updateTransactionWithDetailsBodySchema };
export type { UpdateTransactionWithDetailsBody };
