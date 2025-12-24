import { createRoute } from "@hono/zod-openapi";
import { getManyTransactionsQuerySchema } from "../validators/get-many-transactions-query.validator.ts";
import { getManyTransactionsResponseSchema } from "../schemas/transaction-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getManyTransactionsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Transactions"],
  summary: "Get many transactions",
  security: [{ Bearer: [] }],
  request: { query: getManyTransactionsQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": { schema: getManyTransactionsResponseSchema },
      },
      description: "List of transactions",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getManyTransactionsRoute };
