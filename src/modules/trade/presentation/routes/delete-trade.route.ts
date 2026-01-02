import { createRoute } from "@hono/zod-openapi";
import { tradeIdParamSchema } from "../validators/trade-id-param.validator.ts";
import { notFoundErrorSchema } from "../schemas/error-response.schema.ts";

const deleteTradeRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Trades"],
  summary: "Delete a trade",
  security: [{ Bearer: [] }],
  request: {
    params: tradeIdParamSchema,
  },
  responses: {
    204: {
      description: "Trade deleted successfully",
    },
    404: {
      content: { "application/json": { schema: notFoundErrorSchema } },
      description: "Trade not found",
    },
  },
});

export { deleteTradeRoute };
