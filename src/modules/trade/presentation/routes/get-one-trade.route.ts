import { createRoute } from "@hono/zod-openapi";
import { tradeIdParamSchema } from "../validators/trade-id-param.validator.ts";
import { tradeResponseSchema } from "../schemas/trade-response.schema.ts";
import {
  errorResponseSchema,
  notFoundErrorSchema,
} from "../schemas/error-response.schema.ts";

const getOneTradeRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Trades"],
  summary: "Get trade by ID",
  security: [{ Bearer: [] }],
  request: {
    params: tradeIdParamSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: tradeResponseSchema } },
      description: "Trade details with line items",
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

export { getOneTradeRoute };
