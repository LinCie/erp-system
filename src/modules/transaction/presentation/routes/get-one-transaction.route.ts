import { createRoute } from "@hono/zod-openapi";
import { transactionIdParamSchema } from "../validators/transaction-id-param.validator.ts";
import { transactionResponseSchema } from "../schemas/transaction-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getOneTransactionRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Transactions"],
  summary: "Get transaction by ID",
  security: [{ Bearer: [] }],
  request: { params: transactionIdParamSchema },
  responses: {
    200: { content: { "application/json": { schema: transactionResponseSchema } }, description: "Transaction details" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { getOneTransactionRoute };
