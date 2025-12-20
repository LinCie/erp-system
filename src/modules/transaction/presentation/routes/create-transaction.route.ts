import { createRoute } from "@hono/zod-openapi";
import { createTransactionBodySchema } from "../validators/create-transaction-body.validator.ts";
import { transactionResponseSchema } from "../schemas/transaction-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const createTransactionRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Transactions"],
  summary: "Create a new transaction",
  security: [{ Bearer: [] }],
  request: { body: { content: { "application/json": { schema: createTransactionBodySchema } } } },
  responses: {
    201: { content: { "application/json": { schema: transactionResponseSchema } }, description: "Transaction created successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { createTransactionRoute };
