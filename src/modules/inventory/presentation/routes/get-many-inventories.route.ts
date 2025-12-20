import { createRoute } from "@hono/zod-openapi";
import { getManyInventoriesQuerySchema } from "../validators/get-many-inventories-query.validator.ts";
import { getManyInventoriesResponseSchema } from "../schemas/inventory-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getManyInventoriesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Inventories"],
  summary: "Get many inventories",
  security: [{ Bearer: [] }],
  request: { query: getManyInventoriesQuerySchema },
  responses: {
    200: { content: { "application/json": { schema: getManyInventoriesResponseSchema } }, description: "List of inventories" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { getManyInventoriesRoute };
