import { createRoute } from "@hono/zod-openapi";
import { transactionIdParamSchema } from "../validators/transaction-id-param.validator.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const deleteTransactionRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Delete a transaction",
  security: [{ Bearer: [] }],
  request: { params: transactionIdParamSchema },
  responses: {
    204: { description: "Transaction deleted successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { deleteTransactionRoute };
