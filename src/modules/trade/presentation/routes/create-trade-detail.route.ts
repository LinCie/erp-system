import { createRoute } from "@hono/zod-openapi";
import { tradeIdParamSchema } from "../validators/trade-id-param.validator.ts";
import { createTradeDetailBodySchema } from "../validators/create-trade-detail-body.validator.ts";
import { tradeDetailResponseSchema } from "../schemas/trade-response.schema.ts";
import {
  errorResponseSchema,
  notFoundErrorSchema,
} from "../schemas/error-response.schema.ts";

/**
 * Route for creating a trade detail (line item)
 * POST /trades/{id}/details
 */
const createTradeDetailRoute = createRoute({
  method: "post",
  path: "/{id}/details",
  tags: ["Trade Details"],
  summary: "Create a trade detail",
  description:
    "Create a new detail line item for a trade. The detail will be linked to the trade with detail_type='ITM' and detail_id=item_id.",
  security: [{ Bearer: [] }],
  request: {
    params: tradeIdParamSchema,
    body: {
      content: {
        "application/json": { schema: createTradeDetailBodySchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: tradeDetailResponseSchema } },
      description: "Trade detail created successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: notFoundErrorSchema } },
      description: "Trade or item not found",
    },
  },
});

export { createTradeDetailRoute };
