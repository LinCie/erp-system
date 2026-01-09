import { createRoute } from "@hono/zod-openapi";
import { tradeDetailIdParamSchema } from "../validators/trade-detail-id-param.validator.ts";
import {
  errorResponseSchema,
  notFoundErrorSchema,
} from "../schemas/error-response.schema.ts";

/**
 * Route for deleting a trade detail (line item)
 * DELETE /trades/{id}/details/{detailId}
 */
const deleteTradeDetailRoute = createRoute({
  method: "delete",
  path: "/{id}/details/{detailId}",
  tags: ["Trade Details"],
  summary: "Delete a trade detail",
  description:
    "Delete a trade detail. The detail must belong to the specified trade.",
  security: [{ Bearer: [] }],
  request: {
    params: tradeDetailIdParamSchema,
  },
  responses: {
    204: {
      description: "Trade detail deleted successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: notFoundErrorSchema } },
      description:
        "Trade or detail not found, or detail does not belong to trade",
    },
  },
});

export { deleteTradeDetailRoute };
