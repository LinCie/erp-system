import { createRoute } from "@hono/zod-openapi";
import { tradeIdParamSchema } from "../validators/trade-id-param.validator.ts";
import { updateTradeBodySchema } from "../validators/update-trade-body.validator.ts";
import { tradeResponseSchema } from "../schemas/trade-response.schema.ts";
import {
  errorResponseSchema,
  notFoundErrorSchema,
} from "../schemas/error-response.schema.ts";

const updateTradeRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Trades"],
  summary: "Update a trade",
  security: [{ Bearer: [] }],
  request: {
    params: tradeIdParamSchema,
    body: {
      content: {
        "application/json": { schema: updateTradeBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: tradeResponseSchema } },
      description: "Trade updated successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: notFoundErrorSchema } },
      description: "Trade not found",
    },
  },
});

export { updateTradeRoute };
