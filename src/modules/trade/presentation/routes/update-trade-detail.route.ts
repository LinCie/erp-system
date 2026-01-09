import { createRoute } from "@hono/zod-openapi";
import { tradeDetailIdParamSchema } from "../validators/trade-detail-id-param.validator.ts";
import { updateTradeDetailBodySchema } from "../validators/update-trade-detail-body.validator.ts";
import { tradeDetailResponseSchema } from "../schemas/trade-response.schema.ts";
import {
  errorResponseSchema,
  notFoundErrorSchema,
} from "../schemas/error-response.schema.ts";

/**
 * Route for updating a trade detail (line item)
 * PATCH /trades/{id}/details/{detailId}
 */
const updateTradeDetailRoute = createRoute({
  method: "patch",
  path: "/{id}/details/{detailId}",
  tags: ["Trade Details"],
  summary: "Update a trade detail",
  description:
    "Update an existing trade detail. The transaction_id, detail_type, and detail_id fields are immutable and cannot be updated.",
  security: [{ Bearer: [] }],
  request: {
    params: tradeDetailIdParamSchema,
    body: {
      content: {
        "application/json": { schema: updateTradeDetailBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: tradeDetailResponseSchema } },
      description: "Trade detail updated successfully",
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

export { updateTradeDetailRoute };
