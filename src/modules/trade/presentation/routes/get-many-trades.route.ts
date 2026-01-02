import { createRoute } from "@hono/zod-openapi";
import { getManyTradesQuerySchema } from "../validators/get-many-trades-query.validator.ts";
import { getManyTradesResponseSchema } from "../schemas/trade-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getManyTradesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Trades"],
  summary: "Get many trades",
  security: [{ Bearer: [] }],
  request: {
    query: getManyTradesQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: getManyTradesResponseSchema } },
      description: "List of trades with pagination metadata",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getManyTradesRoute };
