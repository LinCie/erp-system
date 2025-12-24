import { createRoute } from "@hono/zod-openapi";
import { transactionIdParamSchema } from "../validators/transaction-id-param.validator.ts";
import { updateTransactionBodySchema } from "../validators/update-transaction-body.validator.ts";
import { transactionResponseSchema } from "../schemas/transaction-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const updateTransactionRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Update a transaction",
  security: [{ Bearer: [] }],
  request: {
    params: transactionIdParamSchema,
    body: {
      content: { "application/json": { schema: updateTransactionBodySchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: transactionResponseSchema } },
      description: "Transaction updated successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { updateTransactionRoute };
