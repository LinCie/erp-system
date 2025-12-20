import { z } from "@hono/zod-openapi";
import { createTransactionBodySchema } from "./create-transaction-body.validator.ts";

const updateTransactionBodySchema = createTransactionBodySchema.partial().openapi("UpdateTransactionBody");

type UpdateTransactionBody = z.infer<typeof updateTransactionBodySchema>;

export { updateTransactionBodySchema };
export type { UpdateTransactionBody };
