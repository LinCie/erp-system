import { createRoute } from "@hono/zod-openapi";
import { tradeIdParamSchema } from "../validators/trade-id-param.validator.ts";
import { updateTradeTransactionBodySchema } from "../validators/update-trade-transaction-body.validator.ts";
import { tradeResponseSchema } from "../schemas/trade-response.schema.ts";
import {
  errorResponseSchema,
  notFoundErrorSchema,
} from "../schemas/error-response.schema.ts";

/**
 * Route for updating trade transaction (without details)
 * PATCH /trades/{id}
 */
const updateTradeTransactionRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Trades"],
  summary: "Update a trade transaction",
  description:
    "Update trade transaction fields only. Details must not be included and cannot be updated via this endpoint.",
  security: [{ Bearer: [] }],
  request: {
    params: tradeIdParamSchema,
    body: {
      content: {
        "application/json": { schema: updateTradeTransactionBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: tradeResponseSchema } },
      description: "Trade transaction updated successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error or details field included",
    },
    404: {
      content: { "application/json": { schema: notFoundErrorSchema } },
      description: "Trade not found",
    },
  },
});

export { updateTradeTransactionRoute };
