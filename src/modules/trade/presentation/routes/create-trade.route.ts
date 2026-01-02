import { createRoute } from "@hono/zod-openapi";
import { createTradeBodySchema } from "../validators/create-trade-body.validator.ts";
import { tradeResponseSchema } from "../schemas/trade-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const createTradeRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Trades"],
  summary: "Create a new trade",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createTradeBodySchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: tradeResponseSchema } },
      description: "Trade created successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { createTradeRoute };
