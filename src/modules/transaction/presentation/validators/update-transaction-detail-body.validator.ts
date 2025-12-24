import { z } from "@hono/zod-openapi";
import { createTransactionDetailBodySchema } from "./create-transaction-detail-body.validator.ts";

const updateTransactionDetailBodySchema = createTransactionDetailBodySchema
  .omit({ transaction_id: true })
  .partial()
  .openapi("UpdateTransactionDetailBody");

type UpdateTransactionDetailBody = z.infer<
  typeof updateTransactionDetailBodySchema
>;

export { updateTransactionDetailBodySchema };
export type { UpdateTransactionDetailBody };
