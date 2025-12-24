import { createRoute } from "@hono/zod-openapi";
import { transactionIdParamSchema } from "../validators/transaction-id-param.validator.ts";
import { updateTransactionWithDetailsBodySchema } from "../validators/update-transaction-with-details-body.validator.ts";
import { transactionWithDetailsResponseSchema } from "../schemas/transaction-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const updateTransactionWithDetailsRoute = createRoute({
  method: "put",
  path: "/{id}/with-details",
  tags: ["Transactions"],
  summary: "Update transaction with details atomically",
  security: [{ Bearer: [] }],
  request: {
    params: transactionIdParamSchema,
    body: {
      content: {
        "application/json": { schema: updateTransactionWithDetailsBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: transactionWithDetailsResponseSchema },
      },
      description: "Transaction and details updated successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { updateTransactionWithDetailsRoute };
