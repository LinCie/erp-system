import { createRoute } from "@hono/zod-openapi";
import { getManyItemsQuerySchema } from "../validators/getManyItemsQuery.ts";
import { itemListResponseSchema } from "../schemas/item-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getManyItemsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Items"],
  summary: "Get many items",
  security: [{ Bearer: [] }],
  request: {
    query: getManyItemsQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: itemListResponseSchema } },
      description: "List of items",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getManyItemsRoute };
